
import { PoseDetector } from "../pose-detector.js";
import { MotionAnalyzer } from "../motion-analyzer.js";
import { Renderer } from "../renderer.js";
import { STORAGE_KEYS } from "./storage-manager.js";
import { ScoreControls } from "./score-controls.js";
import { ui } from "./ui-controls.js";
import { AchievementManager } from "./achievement-manager.js";

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
        this.scoreValueElement = document.getElementById("scoreValue");
        this.medalElement = document.getElementById("scoreMedal");
        this.playerController = null;
        this.lastMilestone = 0; // Track 1000-point milestones
        this.scoreControls = null;
        this.achievementManager = new AchievementManager();
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
        let lastTime = performance.now();

        const loop = () => {
            if (!this.isRunning) return;

            const now = performance.now();
            const deltaMs = now - lastTime;
            lastTime = now;

            if (this.videoElement.readyState >= 2 && !this.isScoringPaused) { // HAVE_CURRENT_DATA
                const isModelLoading = !this.poseDetector || !this.poseDetector.poseLandmarker;
                if (!isModelLoading) {
                    this.poseDetector.detect(this.videoElement, now, (result) => {
                        this.handleDetectionResult(result, deltaMs);
                    });
                } else {
                    this.handleDetectionResult(null, deltaMs);
                }
            } else if (this.isScoringPaused) {
                // If paused, we do nothing (keep the last frame's rendering)
                // but we still need to manage deltaMs for a clean resume next time
            }
            requestAnimationFrame(loop);
        };
        loop();
    }

    stopLoop() {
        this.isRunning = false;
    }

    handleDetectionResult(result, deltaMs) {
        const isModelLoading = !this.poseDetector || !this.poseDetector.poseLandmarker;
        let pose = null;

        if (result && result.landmarks && result.landmarks.length > 0) {
            pose = result.landmarks[0];

            // Draw
            this.renderer.resize(this.videoElement.videoWidth, this.videoElement.videoHeight);
            this.renderer.clear(); // Clear previous frame
            this.renderer.draw(pose); 
        } else if (!isModelLoading) {
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

            // Update Score UI
            const totalSeconds = Math.floor(score);
            const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
            const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
            const secs = (totalSeconds % 60).toString().padStart(2, "0");
                
            if (this.scoreValueElement) {
                this.scoreValueElement.textContent = `SCORE: ${hrs}:${mins}:${secs}`;
            }

            // Update Medal UI
            if (this.medalElement) {
                const currentMedal = this.achievementManager.getMedalForScore(currentScoreInt);
                if (this.medalElement.textContent !== currentMedal) {
                    this.medalElement.textContent = currentMedal;
                    this.medalElement.title = this.achievementManager.getMedalName(currentScoreInt);
                    this.medalElement.style.transform = "scale(1.3)";
                    setTimeout(() => {
                        this.medalElement.style.transform = "scale(1)";
                    }, 300);
                }
            }
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
            const currentScore = this.motionAnalyzer.getScore();
            if (this.scoreValueElement) {
                this.scoreValueElement.textContent = "SCORE: 00:00:00";
            }
            if (this.medalElement) {
                this.medalElement.textContent = "🥉";
                this.medalElement.title = this.achievementManager.getMedalName(0);
            }
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
