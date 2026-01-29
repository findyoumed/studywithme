/**
 * UI Interactions
 * Handles specific UI event listeners (Mobile sliders, Keyboard shortcuts).
 */

export class UIInteractions {
    constructor(modalManager) {
        this.modalManager = modalManager;
    }

    setupMobileInteractions() {
        document.addEventListener("click", (e) => {
            const opacityContainer = document.querySelector(".opacity-container");
            const sensitivityContainer = document.querySelector(".sensitivity-container");

            if (opacityContainer && e.target.closest(".opacity-container")) {
                if (!e.target.closest("input[type=range]")) {
                    opacityContainer.classList.toggle("active");
                    if (sensitivityContainer) sensitivityContainer.classList.remove("active");
                }
            }
            else if (sensitivityContainer && e.target.closest(".sensitivity-container")) {
                if (!e.target.closest("input[type=range]")) {
                    sensitivityContainer.classList.toggle("active");
                    if (opacityContainer) opacityContainer.classList.remove("active");
                }
            }
            else {
                if (opacityContainer) opacityContainer.classList.remove("active");
                if (sensitivityContainer) sensitivityContainer.classList.remove("active");
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" || e.key === "Esc") {
                this.modalManager.closeAll();
            }
        });
    }

    toggleSpeedMenu() {
        // Look for the menu - it might be inside mobileMenuContainer
        const menu = document.getElementById("speedMenu");
        if (menu) {
            menu.classList.toggle("active");
        } else {
            console.error("UIInteractions: Speed menu element (#speedMenu) not found in DOM.");
        }
    }
}
