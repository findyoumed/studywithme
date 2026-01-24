/**
 * Playlist Renderer
 * Handles rendering the playlist items and updating the count.
 */
export class PlaylistRenderer {
    constructor(playlistManager, ui) {
        this.playlistManager = playlistManager;
        this.ui = ui;
    }

    render(playlist, currentIndex) {
        // Update Count
        const countSpan = document.getElementById("count");
        if (countSpan) countSpan.textContent = playlist.length;

        const listContainer = document.getElementById("playlistItems");
        if (!listContainer) return;

        listContainer.innerHTML = "";
        const lang = this.ui.currentLang || 'ko';
        const t = this.ui && this.ui.i18nManager ? this.ui.i18nManager.translations[lang] : {};

        playlist.forEach((video, index) => {
            const item = document.createElement("div");
            const isActive = currentIndex === index;

            item.className = "playlist-item" + (isActive ? " active" : "");
            item.draggable = true;
            item.dataset.index = index;

            // Attach Drag Events via Manager's handler
            if (this.playlistManager.dragHandler) {
                this.playlistManager.dragHandler.attachEvents(item, index);
            }

            const rawTitle = this.getTitle(video, lang);
            const displayTitle = this.escapeHtml(rawTitle);

            item.innerHTML = `
                <span class="drag-handle" title="${t.drag_handle_title || 'Drag to reorder'}" aria-label="${t.drag_handle_title || 'Drag to reorder'}" role="button" tabindex="0">☰</span>
                <div class="item-info" role="button" tabindex="0" aria-label="Play ${displayTitle}">
                    <span class="video-index">${index + 1}.</span> ${displayTitle}
                </div>
                <div class="item-actions">
                    <button class="playlist-btn icon-btn move-up" title="${t.move_up_title || 'Move up'}" aria-label="${t.move_up_title || 'Move up'}" ${index === 0 ? 'disabled style="opacity:0.3"' : ""}>▲</button>
                    <button class="playlist-btn icon-btn move-down" title="${t.move_down_title || 'Move down'}" aria-label="${t.move_down_title || 'Move down'}" ${index === playlist.length - 1 ? 'disabled style="opacity:0.3"' : ""}>▼</button>
                    <button class="playlist-btn delete-btn" title="${t.delete_title || 'Delete'}" aria-label="${t.delete_title || 'Delete'}">🗑️</button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    getTitle(video, lang) {
        if (!video) return "Untitled";
        const title = video.title;
        if (!title) return "Untitled";
        if (typeof title === "string") return title;
        if (typeof title === "object") {
            return title[lang] || title.ko || title.en || "Untitled";
        }
        return "Untitled";
    }
}
