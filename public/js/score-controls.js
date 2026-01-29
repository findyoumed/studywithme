/**
 * Score Controls Module
 * Handles UI interactions for pausing, resetting, and sharing the score.
 */
export class ScoreControls {
    constructor(motionManager, ui) {
        this.motionManager = motionManager;
        this.ui = ui;
        this.isPaused = false;
        this.container = null;
        this.playPauseBtn = null;
    }

    /**
     * Initialize controls and bind to the DOM
     */
    init() {
        // 1. Initial attempt to inject
        const attemptInit = () => {
            try {
                const scoreEl = document.getElementById("score");
                if (!scoreEl) return false;

                const wrapper = scoreEl.closest(".score-group") || scoreEl.parentElement;
                if (!wrapper) return false;

                // Check if controls already exist to prevent duplicates
                if (wrapper.querySelector(".score-controls")) return true;

                this.setupUI(scoreEl);
                return true;
            } catch (e) {
                return false;
            }
        };

        attemptInit();

        // 2. Setup MutationObserver to handle dynamic UI reloads (e.g., from ui-loader.js)
        // We observe the container where top_controls.html is injected
        const targetContainer = document.getElementById("topControlsContainer") || document.body;

        if (this.observer) this.observer.disconnect();

        this.observer = new MutationObserver((mutations) => {
            // If the score element appears or the controls are missing, try to inject
            const scoreEl = document.getElementById("score");
            if (scoreEl) {
                const wrapper = scoreEl.closest(".score-group") || scoreEl.parentElement;
                if (wrapper && !wrapper.querySelector(".score-controls")) {
                    this.setupUI(scoreEl);
                }
            }
        });

        this.observer.observe(targetContainer, {
            childList: true,
            subtree: true
        });

        // 3. Fallback interval for extra safety (some browsers/edge cases)
        const interval = setInterval(() => {
            if (document.getElementById("score") && attemptInit()) {
                // If we successfully initialized and everything looks stable, 
                // we keep the observer but can slow down or stop the interval
            }
        }, 1000);
        setTimeout(() => clearInterval(interval), 15000); // Stop interval after 15s
    }

    setupUI(scoreEl) {
        try {
            const wrapper = scoreEl.closest(".score-group") || scoreEl.parentElement;
            if (!wrapper) return;

            // Ensure we don't double-inject
            if (wrapper.querySelector(".score-controls")) return;

            const t = this.ui && this.ui.i18nManager && this.ui.i18nManager.translations
                ? (this.ui.i18nManager.translations[this.ui.currentLang] || {})
                : {};

            const controls = document.createElement("div");
            controls.className = "score-controls";

            this.playPauseBtn = this.createButton("pause", t.score_pause || "Pause Scoring", "score_pause", () => this.togglePause());
            const resetBtn = this.createButton("stop", t.score_reset || "Reset Score", "score_reset", () => this.resetScore());
            const shareBtn = this.createButton("share", t.score_share || "Share Score", "score_share", () => this.shareScore());

            controls.appendChild(this.playPauseBtn);
            controls.appendChild(resetBtn);
            controls.appendChild(shareBtn);

            wrapper.appendChild(controls);
        } catch (e) {
            console.error("ScoreControls: setupUI failed", e);
        }
    }

    createButton(iconName, tooltip, i18nKey, onClick) {
        const btn = document.createElement("button");
        btn.className = "score-ctrl-btn";
        btn.title = tooltip;
        btn.dataset.i18nTitle = i18nKey;
        btn.innerHTML = `<span class="material-symbols-outlined">${iconName}</span>`;
        btn.onclick = (e) => {
            e.stopPropagation();
            if (typeof onClick === 'function') onClick();
        };
        return btn;
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.motionManager) {
            // Safety check for methods
            if (typeof this.motionManager.setScoringPaused === 'function') {
                this.motionManager.setScoringPaused(this.isPaused);
            } else if (typeof this.motionManager.togglePause === 'function') {
                // Fallback: togglePause usually toggles isRunning
                const currentlyRunning = !!this.motionManager.isRunning;
                if (this.isPaused === currentlyRunning) {
                    this.motionManager.togglePause();
                }
            }

            const video = this.motionManager.videoElement;
            if (video) {
                if (this.isPaused) {
                    video.pause();
                } else {
                    video.play().catch(e => console.warn("Camera play resumed with error:", e));
                }
            }
        }

        if (this.ui && typeof this.ui.showSplash === 'function') {
            const lang = this.ui.currentLang || 'ko';
            const t = this.ui.i18nManager && this.ui.i18nManager.translations
                ? (this.ui.i18nManager.translations[lang] || {})
                : {};
            const msg = this.isPaused ? (t.score_paused || "Scoring Paused") : (t.score_resumed || "Scoring Resumed");
            this.ui.showSplash(msg);
        }

        if (!this.playPauseBtn) return;
        const icon = this.playPauseBtn.querySelector("span");
        if (!icon) return;

        const t = this.ui && this.ui.i18nManager && this.ui.i18nManager.translations
            ? (this.ui.i18nManager.translations[this.ui.currentLang] || {})
            : {};

        if (this.isPaused) {
            icon.textContent = "play_arrow";
            this.playPauseBtn.title = t.score_play || "Resume Scoring";
            this.playPauseBtn.dataset.i18nTitle = "score_play";
            this.playPauseBtn.classList.add("paused");
        } else {
            icon.textContent = "pause";
            this.playPauseBtn.title = t.score_pause || "Pause Scoring";
            this.playPauseBtn.dataset.i18nTitle = "score_pause";
            this.playPauseBtn.classList.remove("paused");
        }
    }

    resetScore() {
        if (this.motionManager && typeof this.motionManager.resetScore === 'function') {
            this.motionManager.resetScore();
            if (this.ui && typeof this.ui.showSplash === 'function') {
                const t = this.ui.i18nManager && this.ui.i18nManager.translations
                    ? (this.ui.i18nManager.translations[this.ui.currentLang] || {})
                    : {};
                this.ui.showSplash(t.score_reset_done || "SCORE Reset! 🔄");
            }
        }
    }

    shareScore() {
        if (window.shareMyScore) {
            window.shareMyScore();
        }
    }
}
