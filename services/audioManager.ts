
export class AudioManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private musicGain: GainNode;
    private sfxGain: GainNode;
    
    // Buffers
    private titleIntro: AudioBuffer | null = null;
    private titleLoop: AudioBuffer | null = null;
    private gameIntro: AudioBuffer | null = null;
    private gameLoop: AudioBuffer | null = null;

    private activeSources: AudioBufferSourceNode[] = [];
    public isInitialized: boolean = false;
    private currentTrack: 'title' | 'game' | null = null;

    // Volume Settings
    public masterVolume: number = 0.5;
    public musicVolume: number = 0.6;
    public sfxVolume: number = 0.8;

    constructor() {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        // Chain: Source -> TypeGain -> MasterGain -> Destination
        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);

        this.updateVolumes();
    }

    updateVolumes() {
        this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.1);
        this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
        this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.1);
        
        // Save to local storage
        localStorage.setItem('astra_settings', JSON.stringify({
            master: this.masterVolume,
            music: this.musicVolume,
            sfx: this.sfxVolume
        }));
    }
    
    loadSettings() {
        try {
            const data = localStorage.getItem('astra_settings');
            if (data) {
                const settings = JSON.parse(data);
                this.masterVolume = settings.master ?? 0.5;
                this.musicVolume = settings.music ?? 0.6;
                this.sfxVolume = settings.sfx ?? 0.8;
                this.updateVolumes();
            }
        } catch (e) {
            console.error("Failed to load audio settings", e);
        }
    }

    async loadTracks(titleStartUrl: string, titleLoopUrl: string) {
        this.loadSettings();
        try {
            const loadBuffer = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.ctx.decodeAudioData(arrayBuffer);
            };

            // Load Title Tracks
            const [tIntro, tLoop] = await Promise.all([
                loadBuffer(titleStartUrl),
                loadBuffer(titleLoopUrl)
            ]);
            this.titleIntro = tIntro;
            this.titleLoop = tLoop;

            // Attempt to Load Game Tracks (Assuming standard naming convention if not provided)
            try {
                const [gIntro, gLoop] = await Promise.all([
                    loadBuffer('game_start.ogg'),
                    loadBuffer('game_loop.ogg')
                ]);
                this.gameIntro = gIntro;
                this.gameLoop = gLoop;
            } catch (e) {
                console.warn("Game tracks not found, falling back or silent.", e);
            }

            this.isInitialized = true;
            console.log("Audio tracks loaded successfully");
        } catch (error) {
            console.warn("Audio assets not found. Game will run in silent mode.", error);
        }
    }

    async resumeContext() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    private playTheme(intro: AudioBuffer | null, loop: AudioBuffer | null, type: 'title' | 'game') {
        if (this.currentTrack === type) return; // Already playing this theme
        this.stopMusic(); // Stop previous theme

        if (!this.isInitialized || !intro || !loop) return;
        
        this.currentTrack = type;
        const now = this.ctx.currentTime;
        const introDuration = intro.duration;

        // Intro Source
        const introSource = this.ctx.createBufferSource();
        introSource.buffer = intro;
        introSource.connect(this.musicGain); // Connect to Music Gain
        introSource.start(now);

        // Loop Source
        const loopSource = this.ctx.createBufferSource();
        loopSource.buffer = loop;
        loopSource.loop = true;
        loopSource.connect(this.musicGain); // Connect to Music Gain
        loopSource.start(now + introDuration);

        this.activeSources.push(introSource, loopSource);

        introSource.onended = () => {
             const index = this.activeSources.indexOf(introSource);
             if (index > -1) this.activeSources.splice(index, 1);
        };
    }

    playTitleTheme() {
        this.playTheme(this.titleIntro, this.titleLoop, 'title');
    }

    playGameTheme() {
        this.playTheme(this.gameIntro, this.gameLoop, 'game');
    }

    stopMusic() {
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        this.activeSources = [];
        this.currentTrack = null;
    }

    // --- Procedural SFX ---
    // Using oscillators to avoid loading external files for SFX
    
    playSfx(type: 'spawn_normal' | 'spawn_seeker' | 'spawn_titan' | 'powerup' | 'shield_hit' | 'explosion_titan' | 'game_over' | 'checkpoint' | 'alarm' | 'ui_hover' | 'ui_click' | 'slow_down' | 'slow_up' | 'shrink_down' | 'shrink_up' | 'menu_open' | 'menu_close' | 'coin' | 'warp_engage') {
        if (this.ctx.state === 'suspended') return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain); // Connect to SFX Gain

        switch (type) {
            case 'spawn_normal':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
                
            case 'spawn_seeker':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, t);
                osc.frequency.linearRampToValueAtTime(600, t + 0.2);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'spawn_titan':
                const osc1 = this.ctx.createOscillator();
                const gain1 = this.ctx.createGain();
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(55, t); 
                gain1.gain.setValueAtTime(0.6, t);
                gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                osc1.connect(gain1);
                gain1.connect(this.sfxGain);
                osc1.start(t);
                osc1.stop(t + 0.3);

                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(45, t + 0.25);
                gain2.gain.setValueAtTime(0.0, t);
                gain2.gain.setValueAtTime(0.6, t + 0.25);
                gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
                osc2.connect(gain2);
                gain2.connect(this.sfxGain);
                osc2.start(t);
                osc2.stop(t + 1.0);
                break;

            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.setValueAtTime(600, t + 0.1);
                osc.frequency.setValueAtTime(1000, t + 0.2);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.3);
                gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);
                break;
            
            case 'slow_down':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 1.0);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.0, t + 1.0);
                osc.start(t);
                osc.stop(t + 1.0);
                break;
            
            case 'slow_up':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.exponentialRampToValueAtTime(600, t + 1.0);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.0, t + 1.0);
                osc.start(t);
                osc.stop(t + 1.0);
                break;

            case 'shrink_down':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'shrink_up':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'shield_hit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'explosion_titan':
                const bufferSize = this.ctx.sampleRate * 0.5; 
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                noise.connect(gain);
                
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                noise.start(t);
                break;

            case 'game_over':
                // Deeper, longer crash
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(20, t + 2.0);
                gain.gain.setValueAtTime(0.4, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 2.0);
                osc.start(t);
                osc.stop(t + 2.0);
                break;

            case 'checkpoint':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.start(t);
                osc.stop(t + 1.0);
                break;
            
            case 'alarm':
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.setValueAtTime(0, t + 0.2); // Pulse
                osc.frequency.setValueAtTime(600, t + 0.4);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
                gain.gain.linearRampToValueAtTime(0, t + 0.6);
                osc.start(t);
                osc.stop(t + 0.6);
                break;

            case 'ui_hover':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2000, t);
                osc.frequency.exponentialRampToValueAtTime(1000, t + 0.05);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.start(t);
                osc.stop(t + 0.05);
                break;

            case 'ui_click':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'menu_open':
                // CRT Turn on sound (high pitch sweep up + static crackle)
                const oscSweep = this.ctx.createOscillator();
                oscSweep.type = 'sine';
                oscSweep.frequency.setValueAtTime(50, t);
                oscSweep.frequency.exponentialRampToValueAtTime(12000, t + 0.4);
                
                const gainSweep = this.ctx.createGain();
                gainSweep.gain.setValueAtTime(0.1, t);
                gainSweep.gain.linearRampToValueAtTime(0, t + 0.4);
                
                oscSweep.connect(gainSweep);
                gainSweep.connect(this.sfxGain);
                oscSweep.start(t);
                oscSweep.stop(t + 0.4);
                break;

            case 'menu_close':
                 // Reverse sweep
                const oscClose = this.ctx.createOscillator();
                oscClose.type = 'sine';
                oscClose.frequency.setValueAtTime(10000, t);
                oscClose.frequency.exponentialRampToValueAtTime(50, t + 0.2);
                
                const gainClose = this.ctx.createGain();
                gainClose.gain.setValueAtTime(0.05, t);
                gainClose.gain.linearRampToValueAtTime(0, t + 0.2);
                
                oscClose.connect(gainClose);
                gainClose.connect(this.sfxGain);
                oscClose.start(t);
                oscClose.stop(t + 0.2);
                break;
            
            case 'coin':
                // Sharper, clearer ping using two oscillators
                const coinOsc1 = this.ctx.createOscillator();
                coinOsc1.type = 'sine';
                coinOsc1.frequency.setValueAtTime(1200, t);
                coinOsc1.frequency.linearRampToValueAtTime(2000, t + 0.1);

                const coinOsc2 = this.ctx.createOscillator();
                coinOsc2.type = 'square';
                coinOsc2.frequency.setValueAtTime(2400, t);
                coinOsc2.frequency.linearRampToValueAtTime(4000, t + 0.1);
                
                const coinGain = this.ctx.createGain();
                coinGain.gain.setValueAtTime(0.1, t);
                coinGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                
                // Mix the square wave lower volume just for texture
                const coinMix = this.ctx.createGain();
                coinMix.gain.value = 0.1; 
                coinOsc2.connect(coinMix);
                coinMix.connect(coinGain);

                coinOsc1.connect(coinGain);
                coinGain.connect(this.sfxGain);
                
                coinOsc1.start(t);
                coinOsc1.stop(t + 0.3);
                coinOsc2.start(t);
                coinOsc2.stop(t + 0.3);
                break;
                
            case 'warp_engage':
                // Rising sci-fi synth
                const warpOsc = this.ctx.createOscillator();
                warpOsc.type = 'sawtooth';
                warpOsc.frequency.setValueAtTime(100, t);
                warpOsc.frequency.exponentialRampToValueAtTime(2000, t + 1.5);
                
                const warpGain = this.ctx.createGain();
                warpGain.gain.setValueAtTime(0.3, t);
                warpGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

                // Add slight LFO for "wobble"
                const lfo = this.ctx.createOscillator();
                lfo.frequency.value = 15;
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 50;
                lfo.connect(lfoGain);
                lfoGain.connect(warpOsc.frequency);
                lfo.start(t);
                lfo.stop(t + 1.5);
                
                warpOsc.connect(warpGain);
                warpGain.connect(this.sfxGain);
                warpOsc.start(t);
                warpOsc.stop(t + 1.5);
                break;
        }
    }
}

export const audioManager = new AudioManager();
