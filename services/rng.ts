
/**
 * Deterministic Random Number Generator (Mulberry32)
 * 
 * This class provides a seeded RNG to ensure deterministic gameplay.
 * It replaces Math.random() for all game logic.
 */
export class RNG {
  private static _seed: number = Date.now();
  private static _state: number = Date.now();

  /**
   * Initialize the RNG with a specific seed.
   * Call this at the start of the game or when loading a replay.
   */
  public static seed(seed: number) {
    this._seed = seed;
    this._state = seed;
  }

  /**
   * Returns a float between 0 (inclusive) and 1 (exclusive).
   * Replacement for Math.random()
   */
  public static random(): number {
    let t = (this._state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float between min (inclusive) and max (exclusive).
   */
  public static range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * Returns an integer between min (inclusive) and max (exclusive).
   */
  public static int(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }

  /**
   * Returns true or false based on the chance (0.0 to 1.0).
   */
  public static boolean(chance: number = 0.5): boolean {
    return this.random() < chance;
  }

  /**
   * Returns a random element from an array.
   */
  public static choose<T>(array: T[]): T {
    if (array.length === 0) return undefined as any;
    return array[this.int(0, array.length)];
  }

  /**
   * Returns a random ID string.
   */
  public static id(): string {
    return this.random().toString(36).substr(2, 9);
  }
  
  /**
   * Get the current seed (useful for saving replays).
   */
  public static getSeed(): number {
      return this._seed;
  }
}

/**
 * Separate RNG for visual effects that shouldn't affect gameplay state.
 * This ensures that rendering (which can happen at variable frame rates)
 * doesn't desync the gameplay RNG.
 */
export class VisualRNG {
    private static _state: number = Date.now();

    public static random(): number {
        let t = (this._state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    
    public static range(min: number, max: number): number {
        return min + this.random() * (max - min);
    }

    public static int(min: number, max: number): number {
        return Math.floor(this.range(min, max));
    }

    public static seed(seed: number) {
        this._state = seed;
    }

    public static id(): string {
        return this.random().toString(36).substr(2, 9);
    }
    
    public static boolean(chance: number = 0.5): boolean {
        return this.random() < chance;
    }
    
    public static choose<T>(array: T[]): T {
        if (array.length === 0) return undefined as any;
        return array[this.int(0, array.length)];
    }
}