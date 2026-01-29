/**
 * UI Controls (Facade)
 * Orchestrates UI interactions by delegating to specialized modules.
 */

import { ModalManager } from "./modal-manager.js";
import { I18nManager } from "./i18n-manager.js";
import { UILoader } from "./ui-loader.js";
import { UILayout } from "./ui-layout.js";
import { UIUtils } from "./ui-utils.js";
import { UIInteractions } from "./ui-interactions.js";

export class UIControls {
    constructor() {
        this.overlayMode = true; // Kept here for public API access if needed, but synced with Layout module

        this.modalManager = new ModalManager();
        this.i18nManager = new I18nManager();

        // Initialize Modules
        this.loader = new UILoader();
        this.layout = new UILayout();
        this.utils = new UIUtils(this.i18nManager);
        this.interactions = new UIInteractions(this.modalManager);

        // Sync lang
        this.currentLang = this.i18nManager.currentLang;
        this.modalManager.currentLang = this.currentLang;

        // Setup Interactions
        this.interactions.setupKeyboardShortcuts();

        // Load Content
        this.loadControlsContent();

        // Expose critical functions globaly immediately
        window.toggleSpeedMenu = () => this.toggleSpeedMenu();
    }

    async loadControlsContent() {
        await this.loader.loadControlsContent(this);
        // Sync local overlayMode with layout module after load
        this.overlayMode = this.layout.overlayMode;
    }

    // --- Delegated Methods ---

    syncLayoutIcon() {
        this.layout.syncLayoutIcon();
    }

    toggleLayout() {
        const result = this.layout.toggleLayout();
        if (result !== undefined) {
            this.overlayMode = result;
        }
        return result;
    }

    togglePlaylist() {
        this.modalManager.togglePlaylist();
    }

    toggleAbout(tabName = null) {
        this.modalManager.toggleAbout(tabName);
    }

    toggleSpeedMenu() {
        this.interactions.toggleSpeedMenu();
    }

    showSplash(text) {
        this.utils.showSplash(text);
    }

    copyToClipboard() {
        this.utils.copyToClipboard(this.currentLang);
    }

    showLoading(id, show = true) {
        this.utils.showLoading(id, show);
    }

    setupMobileInteractions() {
        this.interactions.setupMobileInteractions();
    }

    // --- Main Logic Kept in Facade (Coordinator) ---

    setLanguage(lang) {
        // Add a temporary class to body to handle transition/layout shift
        document.body.classList.add("lang-switching");

        const updated = this.i18nManager.setLanguage(lang);
        this.currentLang = this.i18nManager.currentLang;
        this.modalManager.currentLang = this.currentLang;

        if (!updated) {
            document.body.classList.remove("lang-switching");
            return;
        }

        // Apply translations immediately
        this.updateUI();

        // If playlist modal is open, re-render items with new language
        const playlistModal = document.getElementById("playlistModal");
        if (playlistModal && playlistModal.classList.contains("active") && window.playlistManager) {
            window.playlistManager.render();
        }

        // If About modal is open, reload content in the selected language
        const aboutModal = document.getElementById("aboutModal");
        if (aboutModal && aboutModal.classList.contains("active")) {
            this.modalManager.loadAboutContent();
        }

        // Remove the class after a short delay to allow layout to settle
        setTimeout(() => {
            document.body.classList.remove("lang-switching");
        }, 300);
    }

    updateUI() {
        this.i18nManager.updatePage();
    }

    updateTimer(formattedTime) {
        const el = document.getElementById("exerciseTimer");
        if (el) el.textContent = formattedTime;
    }
}

export const ui = new UIControls();

// Expose globally via Manager (Maintained for backward compatibility)
window.showPMFSurvey = () => ui.modalManager.showPMFSurvey();
window.closePMFSurvey = () => ui.modalManager.closePMFSurvey();
window.submitPMFSurvey = (r) => ui.modalManager.submitPMFSurvey(r);
window.changeLanguage = (lang) => ui.setLanguage(lang);
