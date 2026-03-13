/**
 * UI Layout
 * Handles layout modes (Overlay vs Split) and syncing UI state.
 */

export class UILayout {
    constructor() {
        this.overlayMode = false;
    }

    syncLayoutIcon() {
        const icon = document.getElementById("layoutIcon");
        const container = document.querySelector(".container");
        if (icon && container) {
            if (this.overlayMode) {
                icon.textContent = "layers";
                container.classList.remove("split-mode");
                container.classList.add("overlay-mode");
            } else {
                icon.textContent = "video_library";
                container.classList.remove("overlay-mode");
                container.classList.add("split-mode");
            }
        }
    }

    toggleLayout() {
        try {
            const container = document.querySelector(".container");
            const icon = document.getElementById("layoutIcon");

            if (!container) {
                console.warn("UILayout: Container not found.");
                return;
            }

            this.overlayMode = !this.overlayMode;

            if (this.overlayMode) {
                container.classList.remove("split-mode");
                container.classList.add("overlay-mode");
                if (icon) icon.textContent = "layers";
            } else {
                container.classList.remove("overlay-mode");
                container.classList.add("split-mode");
                if (icon) icon.textContent = "video_library";
            }

            return this.overlayMode;
        } catch (e) {
            console.error("UILayout: toggleLayout error", e);
        }
    }
}
