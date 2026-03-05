
/**
 * A simple seeded random generator (Mulberry32)
 * to ensure game determinism for replays.
 */
export class SeededRandom {
    private a: number;

    constructor(seed: number) {
        this.a = seed;
    }

    /**
     * Returns a random float between 0 and 1
     */
    next(): number {
        let t = this.a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Returns a random float between min and max
     */
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /**
     * Returns a random boolean
     */
    boolean(chance: number = 0.5): boolean {
        return this.next() < chance;
    }
}

// Global instance for the current run
let currentRandom: SeededRandom = new SeededRandom(Date.now());

export const setGlobalSeed = (seed: number) => {
    currentRandom = new SeededRandom(seed);
};

export const random = () => currentRandom.next();
export const randomRange = (min: number, max: number) => currentRandom.range(min, max);
export const randomBoolean = (chance: number = 0.5) => currentRandom.boolean(chance);
