/**
 * Live UI Manager
 * Handles all UI event listeners for the live functionality.
 */
export class LiveUIManager {
    constructor(liveManager) {
        this.liveManager = liveManager;
        this.btnGoLive = document.getElementById('btnGoLive');
        this.btnCopyRoom = document.getElementById('btnCopyRoom');
        this.btnShowParticipants = document.getElementById('btnShowParticipants');
        this.btnCloseSidebar = document.getElementById('btnCloseSidebar');
        this.participantSidebar = document.getElementById('participantSidebar');
        this.liveStatus = document.getElementById('liveStatus');
        // this.emojiBar = document.getElementById('emojiBar');
    }

    init() {
        // Set the initial room name display
        const roomNameDisplay = document.getElementById('roomNameDisplay');
        if (roomNameDisplay && this.liveManager.channelName) {
            roomNameDisplay.textContent = this.liveManager.channelName;
        }

        if (this.btnGoLive) this.btnGoLive.addEventListener('click', (e) => {
            e.stopPropagation();
            this.liveManager.toggleLive();
        });

        if (this.btnCopyRoom) {
            this.btnCopyRoom.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!this.liveManager.isLive) {
                    console.log("Auto-starting broadcast on share...");
                    await this.liveManager.startBroadcasting();
                }

                const url = new URL(window.location.href);
                url.searchParams.set('room', this.liveManager.channelName);
                url.searchParams.delete('host');
                url.searchParams.set('mode', 'viewer');
                navigator.clipboard.writeText(url.toString());
                const originalIcon = this.btnCopyRoom.innerHTML;
                this.btnCopyRoom.innerHTML = '<span class="material-symbols-outlined">check</span>';
                setTimeout(() => this.btnCopyRoom.innerHTML = originalIcon, 2000);
            });
        }

        if (this.btnShowParticipants) {
            this.btnShowParticipants.addEventListener('click', () => {
                if (this.participantSidebar) this.participantSidebar.classList.toggle('active');
            });
        }

        if (this.btnCloseSidebar) {
            this.btnCloseSidebar.addEventListener('click', () => {
                if (this.participantSidebar) this.participantSidebar.classList.remove('active');
            });
        }

        // document.querySelectorAll('.emoji-btn').forEach(btn => {
        //     btn.addEventListener('click', async (e) => {
        //         e.stopPropagation();
        //         const emoji = btn.dataset.emoji;
        //         if (this.liveManager.rtmClient) {
        //             try {
        //                 await this.liveManager.rtmClient.publish(this.liveManager.channelName, emoji, { channelType: "MESSAGE" });
        //                 this.liveManager.showFloatingEmoji(emoji);
        //             } catch (e) {
        //                 console.warn("Emoji publish failed", e);
        //             }
        //         }
        //     });
        // });
    }

    // [LOG: 20260129_1937] Go Live 버튼 아이콘 상태 표시
    updateButtonsUI(isLive) {
        if (this.btnGoLive) {
            this.btnGoLive.classList.toggle('active', isLive);
            
            // 아이콘 변경
            const icon = this.btnGoLive.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isLive ? 'stop_circle' : 'podcasts';
            }
            
            // 타이틀 변경
            this.btnGoLive.title = isLive ? 'Stop Live' : 'Go Live';
        }
        if (this.liveStatus) {
            this.liveStatus.style.display = isLive ? 'flex' : 'none';
        }
        // if (this.emojiBar) {
        //     this.emojiBar.style.display = isLive ? 'flex' : 'none';
        // }

    }
}
