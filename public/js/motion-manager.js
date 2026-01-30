
import { PoseDetector } from "../pose-detector.js";
import { MotionAnalyzer } from "../motion-analyzer.js";
import { Renderer } from "../renderer.js";
import { STORAGE_KEYS } from "./storage-manager.js";
import { ScoreControls } from "./score-controls.js";
import { ui } from "./ui-controls.js";
import { AchievementManager } from "./achievement-manager.js";
import { ScoreUIManager } from "./motion/score-ui-manager.js";

/**
 * Motion Manager
 * Handles the Motion Detection Loop, rendering, and scoring.
 */
export class MotionManager {
    constructor(storage) {
        this.storage = storage;
        this.renderer = null;
        this.motionAnalyzer = null;
        this.poseDetector = null;
        this.isRunning = false;
        this.videoElement = document.getElementById("camera");
        this.canvasElement = document.getElementById("output_canvas");
        this.scoreElement = document.getElementById("score");
        // dedicated UI manager handles score text/medal
        this.playerController = null;
        this.lastMilestone = 0; // Track 1000-point milestones
        this.scoreControls = null;
        this.achievementManager = new AchievementManager();
        this.scoreUIManager = new ScoreUIManager(this.achievementManager);

        // Loop control
        this.rafId = null;
        this.bgInterval = null;
        this.lastTime = 0;
        this.isScoringPaused = false;
    }

    setPlayer(playerController) {
        this.playerController = playerController;
    }

    async init() {
        if (!this.videoElement || !this.canvasElement) {
            console.warn("MotionManager: Missing video or canvas elements");
            return;
        }

        try {
            // 1. Initialize Score Controls IMMEDIATELY for UI visibility
            this.scoreControls = new ScoreControls(this, ui);
            this.scoreControls.init();

            // 2. Heavy AI model initialization (async)
            this.renderer = new Renderer(this.canvasElement);
            this.motionAnalyzer = new MotionAnalyzer();
            this.poseDetector = new PoseDetector();

            // Restore sensitivity setting
            const sensitivity = this.storage.get(STORAGE_KEYS.SENSITIVITY, 50);
            this.motionAnalyzer.sensitivity = sensitivity * 10;

            this.startLoop();

            console.log("Initializing PoseDetector...");
            const initialized = await this.poseDetector.initialize();
            if (!initialized) {
                this._showError("Pose model failed to load. Please check your network.");
                return;
            }
        } catch (e) {
            console.error("Motion Detection Init Failed", e);
        }
    }

    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();

        if (document.hidden) {
            console.log("MotionManager: Starting in Background Mode (Interval)");
            if (this.bgInterval) clearInterval(this.bgInterval);
            this.bgInterval = setInterval(() => this._runOneStep(), 1000);
        } else {
            console.log("MotionManager: Starting in Foreground Mode (RAF)");
            this._runRAF();
        }
    }

    stopLoop() {
        this.isRunning = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.bgInterval) clearInterval(this.bgInterval);
    }

    _handleVisibilityChange() {
        // Redundant - Logic moved to AppLifecycleManager calling startLoop/stopLoop
        // But for safety, we allow startLoop/stopLoop to be called from there.
    }

    _runRAF() {
        if (!this.isRunning) return; // Removed document.hidden check to prevent self-termination on wake

        this._runOneStep();
        this.rafId = requestAnimationFrame(() => this._runRAF());
    }

    _runOneStep() {
        const now = performance.now();
        // Prevent huge delta jumps, but allow compensation for throttling in background
        const rawDelta = now - this.lastTime;
        const maxGap = document.hidden ? 10000 : 2000; // Allow up to 10s gap in background
        const deltaMs = rawDelta > maxGap ? 1000 : rawDelta;
        this.lastTime = now;

        if (this.videoElement.readyState >= 2 && !this.isScoringPaused) {
            const isModelLoading = !this.poseDetector || !this.poseDetector.poseLandmarker;
            if (!isModelLoading) {
                this.poseDetector.detect(this.videoElement, now, (result) => {
                    this.handleDetectionResult(result, deltaMs);
                });
            } else {
                this.handleDetectionResult(null, deltaMs);
            }
        }
    }



    handleDetectionResult(result, deltaMs) {
        const isModelLoading = !this.poseDetector || !this.poseDetector.poseLandmarker;
        let pose = null;

        if (result && result.landmarks && result.landmarks.length > 0) {
            pose = result.landmarks[0];

            // Draw (Only if visible OR broadcasting)
            // Use safe check for global liveManager
            const isLive = window.liveManager && typeof window.liveManager.isLive === 'function' && window.liveManager.isLive();
            if (!document.hidden || isLive) {
                this.renderer.resize(this.videoElement.videoWidth, this.videoElement.videoHeight);
                this.renderer.clear();
                this.renderer.draw(pose);
            }
        } else if (!isModelLoading && !document.hidden) {
            this.renderer.clear();
        }

        // Analyze Score
        let score = 0;
        if (this.isRunning) {
            score = this.motionAnalyzer.update(pose, deltaMs, isModelLoading);
        } else {
            score = this.motionAnalyzer.getScore();
            this.renderer.clear(); // Clear canvas when paused
            return; // Don't update score UI when paused
        }

        // Check for 600-point (10-minute) milestone
        const currentScoreInt = Math.floor(score);
        if (currentScoreInt >= 600 && currentScoreInt >= this.lastMilestone + 600) {
            this.lastMilestone = Math.floor(currentScoreInt / 600) * 600;
            // window.motionManager.triggerAutoShare(currentScoreInt); // Deactivated per user request
        }

        // Update Score UI (Only if visible)
        if (!document.hidden) {
            this.scoreUIManager.update(score);
        }

        // Explicitly clear reference to help GC in long-running sessions
        pose = null;
    }


    getScore() {
        return this.motionAnalyzer ? this.motionAnalyzer.getScore() : 0;
    }

    getMedalName(score) {
        return this.achievementManager
            ? this.achievementManager.getMedalName(score)
            : "Novice Focus";
    }

    updateSensitivity(val) {
        // Validation handled by storage or UI, here we just set it
        if (this.motionAnalyzer) {
            this.motionAnalyzer.sensitivity = val * 10;
        }
    }

    // [LOG: 20260130_0959] Add setScoringPaused method for score-controls.js
    setScoringPaused(paused) {
        this.isScoringPaused = paused;
        console.log(`[MotionManager] setScoringPaused: ${paused}`);
    }

    togglePause() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.startLoop(); // Resume loop
        }
        console.log(`MotionManager paused state: ${!this.isRunning}`);
    }

    resetScore() {
        if (this.motionAnalyzer) {
            this.motionAnalyzer.reset();
            this.scoreUIManager.reset();
            this.lastMilestone = 0;
        }
    }

    _showError(message) {
        console.error(message);
        const placeholder = document.getElementById("placeholder");
        if (placeholder) {
            placeholder.textContent = message;
        }
    }

    triggerAutoShare(score) {
        try {
            if (window.shareScore) {
                const time = document.getElementById("exerciseTimer")?.textContent || "00:00:00";
                const medal = this.achievementManager.getMedalForScore(score);
                const medalName = this.achievementManager.getMedalName(score);
                console.log(`Auto-sharing score at ${score} points with medal ${medal} (${medalName})`);
                // Auto-share: allowDownload = false (Do not download file automatically)
                window.shareScore.shareScore(score, time, medal, medalName, false);
            }
        } catch (e) {
            console.warn("Auto share failed", e);
        }
    }
}
