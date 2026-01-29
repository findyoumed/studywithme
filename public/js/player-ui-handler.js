/**
 * Player UI Handler
 * Handles speed buttons, flip buttons, and autoplay overlays.
 */
export class PlayerUiHandler {
    constructor(playerController, ui) {
        this.playerController = playerController;
        this.ui = ui;
    }

    setupSpeedControls() {
        document.querySelectorAll(".speed-btn[data-speed]").forEach(btn => {
            btn.setAttribute("aria-pressed", "false"); // Initial state
            btn.addEventListener("click", () => {
                const speed = parseFloat(btn.dataset.speed);
                if (!isNaN(speed)) this.playerController.setSpeed(speed);
            });
        });
    }

    updateSpeedUI(speed) {
        document.querySelectorAll(".speed-btn").forEach(btn => {
            const isActive = parseFloat(btn.dataset.speed) === speed;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", isActive.toString());
        });
    }

    updateFlipUI(flipped) {
        const btn = document.getElementById("flipYoutubeBtn");
        if (btn) {
            btn.classList.toggle("active", flipped);
            btn.setAttribute("aria-pressed", flipped.toString());
        }
    }

    showAutoplayOverlay(player, onPlay) {
        if (document.querySelector('.autoplay-overlay')) return;
        const playerWrapper = document.querySelector('.player-wrapper');
        if (!playerWrapper) return;

        const lang = this.ui.currentLang || 'ko';
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[lang] : {};

        const overlay = document.createElement('div');
        overlay.className = 'autoplay-overlay active';
        overlay.innerHTML = `
            <button class="autoplay-btn">
                <span class="material-symbols-outlined">play_circle</span>
                ${t.autoplay_tap_to_play || 'Tap to Play'}
            </button>
        `;

        overlay.querySelector('button').onclick = () => {
            player.playVideo();
            onPlay();
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };

        playerWrapper.appendChild(overlay);
    }

    showErrorPlaceholder(message) {
        const playerWrapper = document.querySelector('.player-wrapper');
        if (!playerWrapper) return;

        // Remove existing player or placeholders
        playerWrapper.innerHTML = '';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'player-error-placeholder';
        errorDiv.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #000;
            color: #fff;
            text-align: center;
            padding: 20px;
        `;
        errorDiv.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 48px; color: #ff5252; margin-bottom: 16px;">error</span>
            <p style="font-size: 16px; margin: 0;">${message}</p>
        `;
        playerWrapper.appendChild(errorDiv);
        
        // Ensure wrapper is visible
        playerWrapper.style.display = 'block';
    }
}
