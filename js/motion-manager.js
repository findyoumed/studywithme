
import { PoseDetector } from "../pose-detector.js";
import { MotionAnalyzer } from "../motion-analyzer.js";
import { Renderer } from "../renderer.js";
import { STORAGE_KEYS } from "./storage-manager.js";
import { ScoreControls } from "./score-controls.js";
import { ui } from "./ui-controls.js";

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
        this.isScoringPaused = false;
        this.scoreControls = null;
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

            if (this.videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
                const isModelLoading = !this.poseDetector || !this.poseDetector.poseLandmarker;
                if (!isModelLoading) {
                    this.poseDetector.detect(this.videoElement, now, (result) => {
                        this.handleDetectionResult(result, deltaMs);
                    });
                } else {
                    this.handleDetectionResult(null, deltaMs);
                }
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
        if (!this.isScoringPaused) {
            score = this.motionAnalyzer.update(pose, deltaMs, isModelLoading);
        } else {
            score = this.motionAnalyzer.getScore();
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
                const currentMedal = this.getMedalForScore(currentScoreInt);
                if (this.medalElement.textContent !== currentMedal) {
                    this.medalElement.textContent = currentMedal;
                    this.medalElement.title = this.getMedalName(currentScoreInt);
                    this.medalElement.style.transform = "scale(1.3)";
                    setTimeout(() => {
                        this.medalElement.style.transform = "scale(1)";
                    }, 300);
                }
            }
    }

    getMedalForScore(score) {
        const s = Math.floor(score);
        
        // High-Hour Tiers (11h-24h)
        if (s >= 86400) return "🌎"; // 24h
        if (s >= 82800) return "🌈"; // 23h
        if (s >= 79200) return "💘"; // 22h
        if (s >= 75600) return "💞"; // 21h
        if (s >= 72000) return "💓"; // 20h
        if (s >= 68400) return "💗"; // 19h
        if (s >= 64800) return "💖"; // 18h
        if (s >= 61200) return "💜"; // 17h
        if (s >= 57600) return "💙"; // 16h
        if (s >= 54000) return "🩵"; // 15h
        if (s >= 50400) return "💚"; // 14h
        if (s >= 46800) return "💛"; // 13h
        if (s >= 43200) return "🧡"; // 12h
        if (s >= 39600) return "❤️"; // 11h

        // 10-Minute Granular Tiers (0-10h)
        // 9-10h (Legend)
        if (s >= 35400) return "👑"; // 9h50m (Moved 10h crown down slightly for better flow)
        if (s >= 34800) return "🏵️";
        if (s >= 34200) return "💠";
        if (s >= 33600) return "🔱";
        if (s >= 33000) return "⚜️";
        if (s >= 32400) return "🌠"; // 9h (Space)
        
        // 8-9h (Space)
        if (s >= 31800) return "🪐";
        if (s >= 31200) return "🌌";
        if (s >= 30600) return "☄️";
        if (s >= 30000) return "🛰️";
        if (s >= 29400) return "🛸";
        if (s >= 28800) return "✨"; // 8h (Glow)

        // 7-8h (Gems)
        if (s >= 28200) return "🔮";
        if (s >= 27600) return "🧿";
        if (s >= 27000) return "📿";
        if (s >= 26400) return "🏺";
        if (s >= 25800) return "🎐";
        if (s >= 25200) return "🌟"; // 7h (Star)

        // 6-7h (Value)
        if (s >= 24600) return "💍";
        if (s >= 24000) return "👝";
        if (s >= 23400) return "💰";
        if (s >= 22800) return "💵";
        if (s >= 22200) return "🪙";
        if (s >= 21600) return "💎"; // 6h (Diamond)

        // 5-6h (Energy)
        if (s >= 21000) return "⚡";
        if (s >= 20400) return "🔥";
        if (s >= 19800) return "💥";
        if (s >= 19200) return "🌀";
        if (s >= 18600) return "📣";
        if (s >= 18000) return "🏆"; // 5h (Trophy)

        // 4-5h (Elevation)
        if (s >= 17400) return "🚀";
        if (s >= 16800) return "🎈";
        if (s >= 16200) return "☀️";
        if (s >= 15600) return "🌤️";
        if (s >= 15000) return "☁️";
        if (s >= 14400) return "🎖️"; // 4h (Medal)

        // 3-4h (Knowledge)
        if (s >= 13800) return "📚";
        if (s >= 13200) return "📒";
        if (s >= 12600) return "📂";
        if (s >= 12000) return "📜";
        if (s >= 11400) return "✉️";
        if (s >= 10800) return "🏅"; // 3h (Gold Medal)

        // 2-3h (Nature/Growth)
        if (s >= 10200) return "🌳";
        if (s >= 9600)  return "🌵";
        if (s >= 9000)  return "🌴";
        if (s >= 8400)  return "🌿";
        if (s >= 7800)  return "🌱";
        if (s >= 7200)  return "🥇"; // 2h (First Medal)

        // 1-2h (Motion/Transport)
        if (s >= 6600) return "🏎️";
        if (s >= 6000) return "🏍️";
        if (s >= 5400) return "🛵";
        if (s >= 4800) return "🛴";
        if (s >= 4200) return "🚲";
        if (s >= 3600) return "🥈"; // 1h (Second Medal)

        // 0-1h (Hatching)
        if (s >= 3000) return "🦢";
        if (s >= 2400) return "🦆";
        if (s >= 1800) return "🐥";
        if (s >= 1200) return "🐣";
        if (s >= 600)  return "🥚";
        
        return "🥉"; // Initial (0-10m)
    }

    getMedalName(score) {
        const s = Math.floor(score);
        let key = "ach_0";
        
        // High-Hour Tiers (11h-24h)
        if (s >= 86400) key = "ach_86400"; 
        else if (s >= 82800) key = "ach_82800";
        else if (s >= 79200) key = "ach_79200";
        else if (s >= 75600) key = "ach_75600";
        else if (s >= 72000) key = "ach_72000";
        else if (s >= 68400) key = "ach_68400";
        else if (s >= 64800) key = "ach_64800";
        else if (s >= 61200) key = "ach_61200";
        else if (s >= 57600) key = "ach_57600";
        else if (s >= 54000) key = "ach_54000";
        else if (s >= 50400) key = "ach_50400";
        else if (s >= 46800) key = "ach_46800";
        else if (s >= 43200) key = "ach_43200";
        else if (s >= 39600) key = "ach_39600";

        // 10-Minute Granular Tiers (0-10h)
        else if (s >= 35400) key = "ach_35400";
        else if (s >= 34800) key = "ach_34800";
        else if (s >= 34200) key = "ach_34200";
        else if (s >= 33600) key = "ach_33600";
        else if (s >= 33000) key = "ach_33000";
        else if (s >= 32400) key = "ach_32400";
        
        else if (s >= 31800) key = "ach_31800";
        else if (s >= 31200) key = "ach_31200";
        else if (s >= 30600) key = "ach_30600";
        else if (s >= 30000) key = "ach_30000";
        else if (s >= 29400) key = "ach_29400";
        else if (s >= 28800) key = "ach_28800";

        else if (s >= 28200) key = "ach_28200";
        else if (s >= 27600) key = "ach_27600";
        else if (s >= 27000) key = "ach_27000";
        else if (s >= 26400) key = "ach_26400";
        else if (s >= 25800) key = "ach_25800";
        else if (s >= 25200) key = "ach_25200";

        else if (s >= 24600) key = "ach_24600";
        else if (s >= 24000) key = "ach_24000";
        else if (s >= 23400) key = "ach_23400";
        else if (s >= 22800) key = "ach_22800";
        else if (s >= 22200) key = "ach_22200";
        else if (s >= 21600) key = "ach_21600";

        else if (s >= 21000) key = "ach_21000";
        else if (s >= 20400) key = "ach_20400";
        else if (s >= 19800) key = "ach_19800";
        else if (s >= 19200) key = "ach_19200";
        else if (s >= 18600) key = "ach_18600";
        else if (s >= 18000) key = "ach_18000";

        else if (s >= 17400) key = "ach_17400";
        else if (s >= 16800) key = "ach_16800";
        else if (s >= 16200) key = "ach_16200";
        else if (s >= 15600) key = "ach_15600";
        else if (s >= 15000) key = "ach_15000";
        else if (s >= 14400) key = "ach_14400";

        else if (s >= 13800) key = "ach_13800";
        else if (s >= 13200) key = "ach_13200";
        else if (s >= 12600) key = "ach_12600";
        else if (s >= 12000) key = "ach_12000";
        else if (s >= 11400) key = "ach_11400";
        else if (s >= 10800) key = "ach_10800";

        else if (s >= 10200) key = "ach_10200";
        else if (s >= 9600)  key = "ach_9600";
        else if (s >= 9000)  key = "ach_9000";
        else if (s >= 8400)  key = "ach_8400";
        else if (s >= 7800)  key = "ach_7800";
        else if (s >= 7200)  key = "ach_7200";

        else if (s >= 6600) key = "ach_6600";
        else if (s >= 6000) key = "ach_6000";
        else if (s >= 5400) key = "ach_5400";
        else if (s >= 4800) key = "ach_4800";
        else if (s >= 4200) key = "ach_4200";
        else if (s >= 3600) key = "ach_3600";

        else if (s >= 3000) key = "ach_3000";
        else if (s >= 2400) key = "ach_2400";
        else if (s >= 1800) key = "ach_1800";
        else if (s >= 1200) key = "ach_1200";
        else if (s >= 600)  key = "ach_600";
        else return ""; // No title for early progress
        
        // Translate key
        if (ui && ui.i18nManager) {
            const lang = ui.currentLang;
            return ui.i18nManager.translations[lang][key] || key;
        }
        return key; 
    }

    getScore() {
        return this.motionAnalyzer ? this.motionAnalyzer.getScore() : 0;
    }

    updateSensitivity(val) {
        // Validation handled by storage or UI, here we just set it
        if (this.motionAnalyzer) {
            this.motionAnalyzer.sensitivity = val * 10;
        }
    }

    setScoringPaused(isPaused) {
        this.isScoringPaused = isPaused;
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
                this.medalElement.title = this.getMedalName(0);
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
                const medal = this.getMedalForScore(score);
                const medalName = this.getMedalName(score);
                console.log(`Auto-sharing score at ${score} points with medal ${medal} (${medalName})`);
                // Auto-share: allowDownload = false (Do not download file automatically)
                window.shareScore.shareScore(score, time, medal, medalName, false);
            }
        } catch (e) {
            console.warn("Auto share failed", e);
        }
    }
}
