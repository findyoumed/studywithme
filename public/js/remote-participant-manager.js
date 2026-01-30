/**
 * Remote Participant Manager
 * Handles rendering, adding, and removing remote user video elements from the DOM.
 */
export class RemoteParticipantManager {
    constructor(participantsMap) {
        this.participantsMap = participantsMap;
        this.remoteVideoContainer = document.getElementById("remoteVideoContainer");
    }

    getRemoteContainer() {
        if (!this.remoteVideoContainer) {
            this.remoteVideoContainer = document.getElementById("remoteVideoContainer");
        }
        return this.remoteVideoContainer;
    }

    async addParticipant(user) {
        const container = this.getRemoteContainer();
        if (!container) {
            console.error("[ParticipantManager] remoteVideoContainer not found!");
            return;
        }

        // Ensure player container exists
        let remotePlayerContainer = document.getElementById(`user-${user.uid}`);
        if (!remotePlayerContainer) {
            remotePlayerContainer = document.createElement("div");
            remotePlayerContainer.id = `user-${user.uid}`;
            remotePlayerContainer.className = "remote-video-player";
            container.append(remotePlayerContainer);
        }

        // Add nickname label if it doesn't exist
        // Combine nickname and score into a footer overlays
        // [LOG: 20260130_1041] Hide in viewer mode
        const isViewer = new URLSearchParams(window.location.search).get('mode') === 'viewer';
        if (!isViewer && !remotePlayerContainer.querySelector('.remote-info-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'remote-info-overlay';

            // Nickname
            const nickname = this.participantsMap.get(user.uid.toString()) || "User " + user.uid.toString().slice(-4);
            const nameEl = document.createElement('span');
            nameEl.className = 'remote-name';
            nameEl.textContent = nickname;

            // Score Badge
            const scoreEl = document.createElement('span');
            scoreEl.className = 'remote-score';
            scoreEl.id = `score-${user.uid}`;
            scoreEl.innerHTML = '🔥 0';

            overlay.appendChild(nameEl);
            overlay.appendChild(scoreEl);
            remotePlayerContainer.appendChild(overlay);
        }

        // Play the video track if it exists
        if (user.videoTrack) {
            console.log(`[ParticipantManager] Playing video for user ${user.uid}`);
            user.videoTrack.play(remotePlayerContainer, { fit: "cover", mirror: false });

            // [LOG: 20260130_1518] Remove "away" overlay if it exists (host returned)
            this.removeAwayOverlay(user.uid);
        }

        this.updateGridCount();
    }

    // [LOG: 20260130_1518] Show "Mobile device busy" overlay when host unpublishes
    showAwayOverlay(uid) {
        const remotePlayerContainer = document.getElementById(`user-${uid}`);
        if (!remotePlayerContainer) return;

        // Don't add multiple overlays
        if (remotePlayerContainer.querySelector('.away-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'away-overlay';
        overlay.innerHTML = `
            <div class="away-message">
                <span class="away-icon">📱</span>
                <span class="away-text">모바일 기기가 다른 작업 중입니다</span>
                <span class="away-subtext">Mobile device is busy with other tasks</span>
            </div>
        `;
        remotePlayerContainer.appendChild(overlay);
    }

    // [LOG: 20260130_1518] Remove "away" overlay when host returns
    removeAwayOverlay(uid) {
        const remotePlayerContainer = document.getElementById(`user-${uid}`);
        if (!remotePlayerContainer) return;

        const overlay = remotePlayerContainer.querySelector('.away-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    updateScore(uid, score) {
        const scoreEl = document.getElementById(`score-${uid}`);
        if (scoreEl) {
            scoreEl.innerHTML = `🔥 ${score}`;
            // Simple pop animation could be added here via CSS class
        }
    }

    removeParticipant(user) {
        const remotePlayerContainer = document.getElementById(`user-${user.uid}`);
        if (remotePlayerContainer) {
            remotePlayerContainer.remove();
            this.updateGridCount();
        }
    }

    updateGridCount() {
        const container = this.getRemoteContainer();
        if (container) {
            const count = container.children.length;
            container.setAttribute('data-count', count);
            console.log(`[Grid] Updated participant count to: ${count}`);
        }
    }
}
