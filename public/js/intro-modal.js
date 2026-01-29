import { ui } from "./ui-controls.js";

export class IntroModal {
    constructor(playerController) {
        let hasSeen = false;
        try {
            hasSeen = localStorage.getItem('hasSeenIntro') === 'true';
        } catch (e) {
            console.warn('IntroModal: localStorage unavailable', e);
        }
        this.hasShown = hasSeen;
        this.modalOverlay = null;
        this.playerController = playerController;
    }

    async init() {
        // Disabled per user request
        return;

        // If already shown, do nothing
        if (this.hasShown) return;

        await this.loadHTML();
        this.attachEventListeners();
        this.show();
    }

    async loadHTML() {
        try {
            const response = await fetch('html/intro-modal-content.html');
            if (!response.ok) throw new Error('Failed to load intro modal');
            const html = await response.text();

            // Append to body
            document.body.insertAdjacentHTML('beforeend', html);
            this.modalOverlay = document.getElementById('introModalOverlay');

            // Initial UI update for translations
            ui.updateUI();
        } catch (e) {
            console.error('IntroModal: Error loading HTML', e);
        }
    }

    attachEventListeners() {
        if (!this.modalOverlay) return;

        // Start Button
        const startBtn = document.getElementById('startStudyWithMeBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStart());
        }

        // Language Toggle
        const langBtns = this.modalOverlay.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
            });
        });

        // Don't Show Checkbox (Optional: save immediately or on start)
        // We handle saving in handleStart()
    }

    setLanguage(lang) {
        ui.setLanguage(lang);
        // Button state is now handled by I18nManager via ui.updateUI() -> i18nManager.updatePage()
        // But we might need to trigger it manually if the modal is not part of the main page update loop yet?
        // Actually i18nManager.updatePage() selects all .lang-btn, so it should work if the modal is in DOM.
        // However, let's keep the local update just in case or rely on the manager.
        // The manager has:
        // const introKoBtn = document.querySelector('.intro-modal-card .lang-btn[data-lang="ko"]');
        // So it handles it.
    }

    // updateLangButtons is handled by I18nManager globally

    handleStart() {
        const checkbox = document.getElementById('dontShowIntro');
        if (checkbox && checkbox.checked) {
            try {
                localStorage.setItem('hasSeenIntro', 'true');
            } catch (e) {
                console.warn('IntroModal: Failed to persist hasSeenIntro', e);
            }
        }
        this.hide();

        // Start Video Playback
        if (this.playerController) {
            this.playerController.play();
        }
    }

    show() {
        if (this.modalOverlay) {
            // Small delay to allow CSS transition
            setTimeout(() => {
                this.modalOverlay.classList.add('show');
            }, 10);
        }
    }

    hide() {
        if (this.modalOverlay) {
            this.modalOverlay.classList.remove('show');
            setTimeout(() => {
                this.modalOverlay.remove();
                this.modalOverlay = null;
            }, 300); // Match CSS transition duration
        }
    }
}
