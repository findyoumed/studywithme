/**
 * Playlist Drag Handler
 * Handles drag-and-drop logic for the playlist items.
 */
export class PlaylistDragHandler {
    constructor(playlistManager) {
        this.playlistManager = playlistManager;
        this.dragSrcIndex = -1;
    }

    attachEvents(item, index) {
        item.ondragstart = (e) => {
            this.dragSrcIndex = index;
            e.dataTransfer.effectAllowed = "move";
            item.classList.add("dragging");
        };

        item.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        };

        item.ondrop = (e) => {
            e.stopPropagation();
            if (this.dragSrcIndex !== index) {
                this.playlistManager.moveItem(this.dragSrcIndex, index);
            }
            item.classList.remove("dragging");
        };

        item.ondragend = () => {
            item.classList.remove("dragging");
            document.querySelectorAll(".playlist-item").forEach(el => el.classList.remove("dragging"));
        };
    }
}
