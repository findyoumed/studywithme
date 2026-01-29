import { POSE } from './constants.js';

export class MotionAnalyzer {
    constructor() {
        this.score = 0;
        this.sensitivity = 50; // Used for stability threshold (0-100)
        this.prevNoseY = 0;
        this.prevNoseX = 0;
        this.accumulatedMs = 0;
    }

    /**
     * Update score based on stability
     * @param {Object} landmarks 
     * @param {number} deltaMs Time since last frame
     * @returns {number}
     */
    update(landmarks, deltaMs = 33, isInitialLoading = false) {
        if (!landmarks || landmarks.length === 0) {
            if (isInitialLoading) {
                this.accumulatedMs += deltaMs;
                if (this.accumulatedMs >= 1000) {
                    this.score += 1;
                    this.accumulatedMs %= 1000;
                }
            } else {
                // Do NOT reset accumulatedMs on missing frames. Just pause.
                // this.accumulatedMs = 0; 
            }
            return Math.floor(this.score);
        }

        const nose = landmarks[POSE.NOSE];
        if (!nose || nose.visibility < 0.2) {
            if (isInitialLoading) {
                this.accumulatedMs += deltaMs;
                if (this.accumulatedMs >= 1000) {
                    this.score += 1;
                    this.accumulatedMs %= 1000;
                }
            } else {
                // Do NOT reset accumulatedMs on low visibility. Just pause.
                // this.accumulatedMs = 0;
            }
            return Math.floor(this.score);
        }

        // Apply Smoothing to coordinate inputs to reduce jitter reset
        // Increased alpha to 0.9 for maximum responsiveness per user request
        const alpha = 0.9;
        if (this.prevNoseX === 0 && this.prevNoseY === 0) {
            this.prevNoseX = nose.x;
            this.prevNoseY = nose.y;
        }
        
        // Smooth the "current" values before comparing
        const smoothX = this.prevNoseX * (1 - alpha) + nose.x * alpha;
        const smoothY = this.prevNoseY * (1 - alpha) + nose.y * alpha;

        // Stability threshold (Stricter: lower value pauses score on smaller movements)
        // Reduced to 0.002 to ensure score stops when moving
        const baseThreshold = 0.002;
        const threshold = baseThreshold * (this.sensitivity / 50 + 1);

        const diffX = Math.abs(smoothX - this.prevNoseX);
        const diffY = Math.abs(smoothY - this.prevNoseY);
        const totalDiff = diffX + diffY;

        if (totalDiff < threshold) {
            this.accumulatedMs += deltaMs;
            if (this.accumulatedMs >= 1000) {
                this.score += 1;
                this.accumulatedMs %= 1000;
                console.log(`[MotionAnalyzer] Score incremented to: ${this.score}`);
            }
        } else {
            // Only log if we lose significant progress (e.g. > 500ms) to reduce noise
            if (this.accumulatedMs > 500) console.log(`[MotionAnalyzer] Stability broken! Diff: ${totalDiff.toFixed(4)} > Threshold: ${threshold.toFixed(4)}`);
            this.accumulatedMs = 0;
        }

        this.prevNoseX = smoothX;
        this.prevNoseY = smoothY;

        return Math.floor(this.score);
    }

    getScore() {
        return Math.floor(this.score);
    }

    reset() {
        this.score = 0;
        this.prevNoseX = 0;
        this.prevNoseY = 0;
        this.accumulatedMs = 0;
    }
}
