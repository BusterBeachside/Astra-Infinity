
import { GameState } from '../types';
import { CONSTANTS } from '../constants';

export interface TutorialStep {
    id: string;
    title: string;
    message: string;
    triggerTime?: number;
    triggerCondition?: (gs: GameState) => boolean;
    nextTimeJump?: number;
    spawnPowerup?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'intro',
        title: 'MISSION START',
        message: 'Drag to pilot your ship. Avoid enemy ships. Survive as long as possible.',
        triggerTime: 0.5,
        nextTimeJump: 4
    },
    {
        id: 'grazing',
        title: 'ENEMY GRAZING',
        message: 'Colliding with an enemy ship means game over, but you can gain bonus points for getting up close and personal. The longer you graze, the higher your risk, and the higher your bonus! HINT: On desktop, try holding down Ctrl to show hitboxes.',
        triggerTime: 5,
        nextTimeJump: 14
    },
    {
        id: 'powerup',
        title: 'SUPPLY DROP DETECTED',
        message: 'Collect colored modules for temporary upgrades. Green=Shield, Blue=Slow, Yellow=Shrink.',
        triggerTime: 15,
        nextTimeJump: 55,
        spawnPowerup: true
    },
    {
        id: 'diagonal',
        title: 'WARNING: ANOMALY DETECTED',
        message: 'Enemy vessel patterns changing. Watch the top corners.',
        triggerTime: 60,
        nextTimeJump: 115
    },
    {
        id: 'seeker',
        title: 'THREAT ALERT: SEEKER DRONES',
        message: 'Enemy units locking on. Evasive maneuvers recommended.',
        triggerTime: 120,
        nextTimeJump: 175
    },
    {
        id: 'titan',
        title: 'WARNING: TITAN CLASS DETECTED',
        message: 'Massive pursuer detected. Outlast its energy reserves and evade the final detonation.',
        triggerTime: 180,
        nextTimeJump: 235
    },
    {
        id: 'side_seeker',
        title: 'WARNING: LATERAL INCURSION',
        message: 'Homing enemies attacking from flanks. Avoid the walls.',
        triggerTime: 240,
        nextTimeJump: 295
    },
    {
        id: 'floor_hazard',
        title: 'ENVIRONMENTAL HAZARD',
        message: 'Space compression detected. Avoid the rising spikes.',
        triggerCondition: (gs) => gs.compressionState === 1 || gs.elapsedTime >= 300,
        nextTimeJump: 305
    },
    {
        id: 'tutorial_complete',
        title: 'MISSION BRIEFING COMPLETE',
        message: 'Mission briefing complete! To exit, tap the pause button (Esc on desktop) and select "Abort Mission". Best of luck, pilot.',
        triggerTime: 305
    }
];

export const tutorialService = {
    getNextStep: (gs: GameState, seenIds: Set<string>): TutorialStep | null => {
        if (gs.gameMode !== 'tutorial') return null;

        for (const step of TUTORIAL_STEPS) {
            if (seenIds.has(step.id)) continue;

            if (step.triggerTime !== undefined && gs.elapsedTime >= step.triggerTime) {
                return step;
            }
            if (step.triggerCondition && step.triggerCondition(gs)) {
                return step;
            }
            
            // Steps are sequential in tutorial mode
            break;
        }
        return null;
    }
};
