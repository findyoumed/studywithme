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
        const scoreEl = document.getElementById("score");
        if (!scoreEl) return;

        // Create a wrapper for the entire score overlay if not already present
        // In this implementation, we assume the HTML structure will be updated to:
        // <div class="score-overlay-wrapper">
        //    <div id="score">SCORE: 00:00:00</div>
        //    <div class="score-controls">...btns...</div>
        // </div>
        
        // However, to be less intrusive to index.html, we can just inject the buttons next to it
        this.setupUI(scoreEl);
    }

    setupUI(scoreEl) {
        // Find the wrapper (.score-group)
        const wrapper = scoreEl.closest(".score-group");
        if (!wrapper) {
            console.warn("ScoreControls: .score-group wrapper not found");
            return;
        }

        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};

        // Create controls container
        const controls = document.createElement("div");
        controls.className = "score-controls";
        
        // Play/Pause button
        this.playPauseBtn = this.createButton("pause", t.score_pause || "Pause Scoring", "score_pause", () => this.togglePause());
        
        // Reset button
        const resetBtn = this.createButton("stop", t.score_reset || "Reset Score", "score_reset", () => this.resetScore());
        
        // Share button
        const shareBtn = this.createButton("share", t.score_share || "Share Score", "score_share", () => this.shareScore());

        controls.appendChild(this.playPauseBtn);
        controls.appendChild(resetBtn);
        controls.appendChild(shareBtn);

        // Append controls to the wrapper
        wrapper.appendChild(controls);
    }

    createButton(iconName, tooltip, i18nKey, onClick) {
        const btn = document.createElement("button");
        btn.className = "score-ctrl-btn";
        btn.title = tooltip;
        btn.dataset.i18nTitle = i18nKey;
        btn.innerHTML = `<span class="material-symbols-outlined">${iconName}</span>`;
        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering background clicks
            onClick();
        };
        return btn;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const icon = this.playPauseBtn.querySelector("span");
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};

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
        
        if (this.motionManager) {
            this.motionManager.setScoringPaused(this.isPaused);
        }
    }

    resetScore() {
        if (this.motionManager) {
            this.motionManager.resetScore();
            
            const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[this.ui.currentLang] : {};
            this.ui.showSplash(t.score_reset_done || "SCORE Reset! 🔄");
        }
    }

    shareScore() {
        // Trigger the global share logic
        if (window.shareMyScore) {
            window.shareMyScore();
        }
    }
}
