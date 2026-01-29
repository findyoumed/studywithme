/**
 * UI Search Module
 * Handles Video Search and Add interactions
 */

function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

export function bindSearchAPI(playlistManager, ui) {
    window.searchVideos = async () => {
        const input = document.getElementById("searchInput");
        const container = document.getElementById("searchResults");
    
        if (!input || !container) return;
    
        const query = input.value.trim();
        const t = ui.i18nManager ? ui.i18nManager.translations[ui.currentLang] : {};
        if (!query) {
          ui.showSplash(t.search_empty || "Please enter a search term.");
          return;
        }
    
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #aaa;">${t.searching || "Searching..."}</div>`;
    
        try {
          const results = await playlistManager.searchYouTube(query);
    
          container.innerHTML = ""; // Clear
    
          if (results.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #aaa;">${t.no_results || "No results found."}</div>`;
            return;
          }
    
          results.forEach((video) => {
            const rawTitle = video.title || "Untitled";
            const safeTitle = escapeHtml(rawTitle);
            const safeChannel = escapeHtml(video.channel || "");
            const safeThumb = video.thumbnail || "icon-192.png";
            const el = document.createElement("div");
            el.className = "search-item-card";
            el.innerHTML = `
                        <img class="search-item-thumb" src="${safeThumb}" alt="${safeTitle}">
                        <div class="search-item-info">
                            <div class="search-item-title" title="${safeTitle}">${safeTitle}</div>
                            <div class="search-item-channel">${safeChannel}</div>
                            <button class="search-add-btn" data-id="${video.id}" data-title="${safeTitle}">
                                + ${t.add || "Add"}
                            </button>
                        </div>
                    `;
            container.appendChild(el);
          });
    
          // Add event delegation for the "Add" buttons
          container.onclick = (e) => {
            const btn = e.target.closest(".search-add-btn");
            if (btn) {
              const id = btn.dataset.id;
              const title = btn.dataset.title;
              if (id) window.addVideoFromResult(id, title);
            }
          };
        } catch (e) {
          container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff5555;">${t.error || "Error occurred"}</div>`;
          console.error(e);
        }
    };
    
    window.addVideoFromResult = (id, title) => {
        playlistManager.addVideo(id, title);
    };

    window.addVideo = async () => {
        const urlInput = document.getElementById("urlInput");
        const titleInput = document.getElementById("titleInput");
        if (urlInput && urlInput.value.trim()) {
          const url = urlInput.value.trim();
          const title = titleInput ? titleInput.value.trim() : null;
          const success = await playlistManager.addVideoFromUrl(url, title);
          if (success) {
            urlInput.value = "";
            if (titleInput) titleInput.value = "";
          }
        }
    };

    window.handleSearchKeyPress = (e) => {
        if (e.key === "Enter") window.searchVideos();
    };
}
