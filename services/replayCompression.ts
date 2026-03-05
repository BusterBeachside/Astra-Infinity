import { ReplayData, ReplayInputFrame } from '../types';

/**
 * Compresses replay inputs into a base64 string of a Float32Array.
 * This significantly reduces the storage size of replays in localStorage.
 */
export const compressReplay = (replay: ReplayData): ReplayData => {
    if (replay.isCompressed || typeof replay.inputs === 'string') {
        return replay;
    }

    const inputs = replay.inputs as ReplayInputFrame[];
    const buffer = new Float32Array(inputs.length * 3);
    
    for (let i = 0; i < inputs.length; i++) {
        const frame = inputs[i];
        buffer[i * 3] = frame.dt;
        buffer[i * 3 + 1] = frame.x || 0;
        buffer[i * 3 + 2] = frame.y || 0;
    }

    // Convert Float32Array to base64 string
    // We use a Uint8Array view to get the raw bytes
    const uint8View = new Uint8Array(buffer.buffer);
    let binary = '';
    const len = uint8View.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8View[i]);
    }
    const base64 = btoa(binary);

    return {
        ...replay,
        inputs: base64,
        isCompressed: true
    };
};

/**
 * Decompresses a replay's inputs from a base64 string back into an array of frames.
 */
export const decompressReplay = (replay: ReplayData): ReplayData => {
    if (!replay.isCompressed || typeof replay.inputs !== 'string') {
        return replay;
    }

    try {
        const binary = atob(replay.inputs);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const buffer = new Float32Array(bytes.buffer);

        const frames: ReplayInputFrame[] = [];
        
        for (let i = 0; i < buffer.length; i += 3) {
            frames.push({
                dt: buffer[i],
                x: buffer[i + 1],
                y: buffer[i + 2]
            });
        }

        return {
            ...replay,
            inputs: frames,
            isCompressed: false
        };
    } catch (e) {
        console.error("Failed to decompress replay", e);
        return replay;
    }
};
