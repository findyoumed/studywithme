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
        if (!remotePlayerContainer.querySelector('.remote-video-label')) {
            const nickname = this.participantsMap.get(user.uid.toString()) || "Anonymous";
            const label = document.createElement('div');
            label.className = 'remote-video-label';
            label.textContent = nickname;
            remotePlayerContainer.appendChild(label);
        }

        // Play the video track if it exists
        if (user.videoTrack) {
            console.log(`[ParticipantManager] Playing video for user ${user.uid}`);
            user.videoTrack.play(remotePlayerContainer, { fit: "cover", mirror: false });
        }

        this.updateGridCount();
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
