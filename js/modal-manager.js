
/**
 * Modal Manager
 * Handles all modal operations: Playlist, About, PMF Survey.
 */
export class ModalManager {
    constructor() {
        this.currentLang = "ko"; // Will be updated by UIControls
    }

    async loadPMFModal() {
        try {
            const response = await fetch("components/pmf_modal.html");
            if (response.ok) {
                const html = await response.text();
                document.body.insertAdjacentHTML('beforeend', html);
            }
        } catch (e) {
            console.error("Failed to load PMF modal", e);
        }
    }

    togglePlaylist() {
        this._toggleModal("playlistModal");
        if (document.getElementById("playlistModal").classList.contains("active")) {
            this.loadPlaylistContent();
        }
    }

    async loadPlaylistContent() {
        const modal = document.getElementById("playlistModal");
        if (!modal || modal.dataset.loaded === "true") return;

        try {
            const response = await fetch("modals/playlist_content.html", { cache: 'no-store' });
            if (!response.ok) throw new Error("Failed to load playlist content");
            const html = await response.text();
            modal.innerHTML = html;
            modal.dataset.loaded = "true";
            // Apply translations to injected content
            try { if (window.ui && typeof window.ui.updateUI === 'function') window.ui.updateUI(); } catch (e) { }

            if (window.playlistManager) {
                window.playlistManager.render();
            }
        } catch (e) {
            console.error("ModalManager: Error loading playlist content", e);
            try {
                const t = (window.ui && window.ui.i18nManager) ? window.ui.i18nManager.translations[ this.currentLang ] : null;
                const msg = t && t.error ? t.error : 'Error occurred';
                modal.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff5555;">${msg}</div>`;
            } catch(_) {
                modal.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff5555;">Error occurred</div>';
            }
        }
    }

    toggleAbout(tabName = null) {
        this._toggleModal("aboutModal");
        if (document.getElementById("aboutModal").classList.contains("active")) {
            this.loadAboutContent(tabName);
        }
    }

    async loadAboutContent(targetTab = null) {
        const body = document.getElementById("aboutModalBody");
        if (!body) return;

        // If already loaded in current lang, just switch tab
        if (body.dataset.loaded === "true" && body.dataset.loadedLang === this.currentLang) {
            if (targetTab) this.switchTab(targetTab);
            return;
        }

        try {
            const langSuffix = this.currentLang === "en" ? "_en" : "_ko";
            const response = await fetch(`modals/about_content${langSuffix}.html?t=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error("Failed to load content");
            const html = await response.text();
            body.innerHTML = html;
            body.dataset.loaded = "true";
            body.dataset.loadedLang = this.currentLang;

            // Apply translations to static labels (tabs/header)
            try { if (window.ui && typeof window.ui.updateUI === 'function') window.ui.updateUI(); } catch (e) { }

            this.setupModalTabs();
            if (targetTab) this.switchTab(targetTab);
        } catch (e) {
            console.error("ModalManager: Error loading about content", e);
            try {
                const t = (window.ui && window.ui.i18nManager) ? window.ui.i18nManager.translations[ this.currentLang ] : null;
                const msg = t && t.error ? t.error : 'Error occurred';
                body.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff5555;">${msg}</div>`;
            } catch(_) {
                body.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff5555;">Error occurred</div>';
            }
        }
    }

    _toggleModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.warn(`ModalManager: Modal "${modalId}" not found.`);
                return;
            }
            modal.classList.toggle("active");

            if (modal.classList.contains("active")) {
                if (modalId === "playlistModal") this._closeModal("aboutModal");
                if (modalId === "aboutModal") this._closeModal("playlistModal");
            }
        } catch (e) {
            console.error(`ModalManager: Error toggling modal ${modalId}`, e);
        }
    }

    _closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("active");
    }

    closeAll() {
        this._closeModal("aboutModal");
        this._closeModal("playlistModal");
        this.closePMFSurvey();
    }

    switchTab(tabName) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }

    setupModalTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        if (tabs.length === 0) return;

        tabs.forEach((tab) => {
            if (tab.tagName === 'A') return;

            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);

            newTab.addEventListener('click', () => {
                const tabName = newTab.dataset.tab;
                const allTabs = document.querySelectorAll('.tab-btn');
                const allContents = document.querySelectorAll('.tab-content');

                allTabs.forEach(t => t.classList.remove('active'));
                allContents.forEach(c => c.classList.remove('active'));

                newTab.classList.add('active');
                const targetContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // PMF Logic within Manager
    // Helper to load HTML into specific container (if not exists)
     async _loadHtml(url, containerId) {
        // Simple fetch and append to body if container logic is complex
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                document.body.insertAdjacentHTML('beforeend', html);
            }
        } catch (e) {
            console.error("Failed to load component", e);
        }
    }

    _safeGetLocal(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("ModalManager: localStorage unavailable", e);
            return null;
        }
    }

    _safeSetLocal(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("ModalManager: Failed to persist localStorage", e);
        }
    }

    _safeSetSession(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            console.warn("ModalManager: Failed to persist sessionStorage", e);
        }
    }
}
