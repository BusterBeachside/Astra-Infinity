import { supabase, GAME_SLUG } from './supabase';
import { UserProgress, GameSettings, HighScoreEntry, ReplayData, OnlineProfile, LeaderboardEntry } from '../types';

let cachedGameId: string | null = null;
let cachedUser: any = null;
let lastUserCheck = 0;

async function getGameId() {
    if (cachedGameId) return cachedGameId;
    const { data, error } = await supabase
        .from('games')
        .select('id')
        .eq('slug', GAME_SLUG)
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching game ID:", error);
        return null;
    }

    if (!data) {
        console.warn(`[Astra_Net] Game record for slug "${GAME_SLUG}" not found. Online features will be limited until the game is registered in the 'games' table.`);
        return null;
    }

    cachedGameId = data.id;
    return data.id;
}

export const supabaseService = {
    // --- Auth ---
    async getCurrentUser() {
        const now = Date.now();
        // Cache user for 2 seconds to prevent rapid parallel auth calls
        if (cachedUser && now - lastUserCheck < 2000) return cachedUser;
        
        const { data: { user } } = await supabase.auth.getUser();
        cachedUser = user;
        lastUserCheck = now;
        return user;
    },

    clearUserCache() {
        cachedUser = null;
        lastUserCheck = 0;
    },

    async getProfile(userId: string): Promise<OnlineProfile | null> {
        let { data, error }: { data: any, error: any } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code === '42703') {
            // Column doesn't exist, retry without avatar_id
            const retry = await supabase
                .from('profiles')
                .select('id, username, avatar_url, created_at')
                .eq('id', userId)
                .single();
            data = retry.data;
            error = retry.error;
        }

        if (error) return null;
        return data;
    },

    async updateProfile(profile: Partial<OnlineProfile>) {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = profile.id || user?.id;
        
        if (!userId) return { error: new Error("No user ID provided or logged in") };

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...profile });
        
        if (error && error.code === '42703' && profile.avatar_id) {
            // Column doesn't exist, retry without avatar_id
            const { avatar_id, ...rest } = profile;
            const retry = await supabase
                .from('profiles')
                .upsert({ id: userId, ...rest });
            return { error: retry.error, columnMissing: true };
        }
        
        return { error };
    },

    // --- Game Data Sync ---
    async syncUserData(progress: UserProgress, settings: GameSettings) {
        const user = await this.getCurrentUser();
        if (!user) return;

        const gameId = await getGameId();
        if (!gameId) return;

        // We store the full progress object in the 'stats' column to ensure all fields (tutorials, unlocks, etc.) are synced
        const { error } = await supabase
            .from('user_game_data')
            .upsert({
                user_id: user.id,
                game_id: gameId,
                currency: progress.coins,
                stats: progress as any, // Sync full progress object
                settings: settings,
                updated_at: new Date().toISOString()
            });
        
        return { error };
    },

    async fetchUserData(): Promise<{ progress: Partial<UserProgress>, settings: Partial<GameSettings> } | null> {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const gameId = await getGameId();
        if (!gameId) return null;

        const { data, error } = await supabase
            .from('user_game_data')
            .select('currency, stats, settings')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .single();
        
        if (error) return null;

        // If 'stats' contains the full progress object (from our new sync logic), use it.
        // Otherwise fallback to the old structure.
        const statsData = data.stats as any;
        const progress: Partial<UserProgress> = statsData && statsData.tutorialsSeen 
            ? statsData 
            : { coins: data.currency, stats: statsData };

        return {
            progress,
            settings: data.settings as any
        };
    },

    // --- Leaderboards & Replays ---
    async submitScore(score: number, mode: string, metadata: any, replay: ReplayData | null) {
        const user = await this.getCurrentUser();
        if (!user) return;

        const gameId = await getGameId();
        if (!gameId) return;

        // 1. Check if this is a new best score for this user/mode
        // We look for the existing best record to see if we should replace the replay
        const { data: existingBest } = await supabase
            .from('leaderboards')
            .select('id, score, replay_path')
            .eq('game_id', gameId)
            .eq('user_id', user.id)
            .contains('metadata', { mode })
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle();

        const isNewBest = !existingBest || score > existingBest.score;
        
        // 2. Determine if we should save the replay
        // We only save replays for new personal bests AND if it's likely to be in the Top 50
        let replayPath = existingBest?.replay_path || null;

        if (isNewBest && replay) {
            // Check if score is in Top 50
            const { data: top50 } = await supabase
                .from('leaderboards')
                .select('score')
                .eq('game_id', gameId)
                .contains('metadata', { mode })
                .order('score', { ascending: false })
                .range(49, 49)
                .maybeSingle();
            
            const isInTop50 = !top50 || score > top50.score;

            if (isInTop50) {
                // Delete old replay if it exists
                if (existingBest?.replay_path) {
                    try {
                        await supabase.storage
                            .from('game-replays')
                            .remove([existingBest.replay_path]);
                    } catch (e) {
                        console.warn("[Astra_Net] Could not delete old replay:", e);
                    }
                }

                // Upload new replay
                // Use a unique filename to avoid RLS 'UPDATE' policy issues with upsert
                const timestamp = Date.now();
                const fileName = `${GAME_SLUG}/${mode}_${timestamp}.json`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('game-replays')
                    .upload(`${user.id}/${fileName}`, JSON.stringify(replay), {
                        contentType: 'application/json',
                        upsert: false // Use false to avoid UPDATE policy requirements
                    });
                
                if (!uploadError) {
                    replayPath = uploadData.path;
                } else {
                    console.error("[Astra_Net] Replay upload failed:", uploadError);
                }
            } else if (existingBest?.replay_path) {
                // If we are no longer in Top 50 (unlikely if it was a personal best, but possible if others improved)
                // Or if we just want to keep the old one. 
                // Actually, if it's a personal best but NOT in Top 50, we might want to delete the old replay to save space
                // as the user requested "only save replays for the Top 50 players".
                try {
                    await supabase.storage
                        .from('game-replays')
                        .remove([existingBest.replay_path]);
                    replayPath = null;
                } catch (e) {}
            }
        }

        // 3. Upsert the leaderboard entry
        // If we have an existing record for this mode, we update it to keep only the best
        const payload = {
            game_id: gameId,
            user_id: user.id,
            score: isNewBest ? score : existingBest?.score || score,
            metadata: { ...metadata, mode },
            replay_path: replayPath,
            created_at: new Date().toISOString()
        };

        let result;
        if (existingBest) {
            result = await supabase
                .from('leaderboards')
                .update(payload)
                .eq('id', existingBest.id);
        } else {
            result = await supabase
                .from('leaderboards')
                .insert(payload);
        }
        
        if (result.error) {
            console.error("[Astra_Net] Error submitting score:", result.error);
        }
        
        return { error: result.error };
    },

    async getLeaderboard(mode: string, limit = 50): Promise<LeaderboardEntry[]> {
        const gameId = await getGameId();
        if (!gameId) return [];

        // Try with avatar_id first, fallback if column doesn't exist
        const selectWithAvatar = `
            id,
            score,
            metadata,
            replay_path,
            created_at,
            user_id,
            profiles!leaderboards_user_id_fkey (
                username,
                avatar_url,
                avatar_id
            )
        `;

        const selectWithoutAvatar = `
            id,
            score,
            metadata,
            replay_path,
            created_at,
            user_id,
            profiles!leaderboards_user_id_fkey (
                username,
                avatar_url
            )
        `;

        let { data, error }: { data: any, error: any } = await supabase
            .from('leaderboards')
            .select(selectWithAvatar)
            .eq('game_id', gameId)
            .contains('metadata', { mode })
            .order('score', { ascending: false })
            .limit(limit);
        
        if (error && error.code === '42703') {
            // Column doesn't exist, retry without avatar_id
            const retry = await supabase
                .from('leaderboards')
                .select(selectWithoutAvatar)
                .eq('game_id', gameId)
                .contains('metadata', { mode })
                .order('score', { ascending: false })
                .limit(limit);
            data = retry.data;
            error = retry.error;
        }
        
        if (error) {
            console.error("[Astra_Net] Error fetching leaderboard:", error);
            return [];
        }

        console.log(`[Astra_Net] Fetched ${data.length} leaderboard entries for mode: ${mode}`, data[0]);

        return data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            username: item.profiles?.username || 'Unknown Pilot',
            avatar_url: item.profiles?.avatar_url || '',
            avatar_id: item.profiles?.avatar_id || '',
            score: item.score,
            name: item.profiles?.username || 'Unknown Pilot',
            date: item.created_at,
            replay_path: item.replay_path,
            created_at: item.created_at,
            metadata: item.metadata
        }));
    },

    async downloadReplay(path: string): Promise<ReplayData | null> {
        const { data, error } = await supabase.storage
            .from('game-replays')
            .download(path);
        
        if (error || !data) return null;

        const text = await data.text();
        return JSON.parse(text);
    }
};
