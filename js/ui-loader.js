/**
 * UI Loader
 * Handles dynamic loading of HTML content into containers.
 */

export class UILoader {
    constructor() {}

    async loadControlsContent(uiControls) {
        const timestamp = Date.now(); // Cache buster
        const containers = [
            { id: "controlsContainer", url: `components/controls_content.html?v=${timestamp}` },
            { id: "mobileMenuContainer", url: `components/mobile_menu.html?v=${timestamp}` },
            { id: "aboutModalContainer", url: `components/about_modal.html?v=${timestamp}` }
        ];

        for (const { id, url } of containers) {
            const container = document.getElementById(id);
            if (!container) continue;

            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                const html = await response.text();
                container.innerHTML = html;
            } catch (e) {
                console.error(`UILoader: Error loading ${url}`, e);
            }
        }

        // Trigger post-load updates via the main controller
        if (uiControls) {
            uiControls.updateUI(); // Apply translations
            uiControls.interactions.setupMobileInteractions(); // Bind events
            uiControls.modalManager.loadPMFModal(); // Load PMF Modal
            uiControls.layout.syncLayoutIcon(); // Sync Layout State
        }
    }
}
