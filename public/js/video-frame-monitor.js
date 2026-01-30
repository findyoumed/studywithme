/**
 * [LOG: 20260130_1650] Video Frame Monitor
 * Monitors remote video frame rate and shows overlay when frames stop (background)
 */
export class VideoFrameMonitor {
    constructor(rtcClient, remoteParticipantManager) {
        this.rtcClient = rtcClient;
        this.remoteParticipantManager = remoteParticipantManager;
        this.monitoredUsers = new Map(); // uid -> { lastFrameCount, isStalled }
        this.monitorInterval = null;
    }

    startMonitoring() {
        if (this.monitorInterval) return;

        console.log("[FrameMonitor] Starting video frame monitoring");

        // Check every 2 seconds
        this.monitorInterval = setInterval(() => {
            this.checkAllUsers();
        }, 2000);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            console.log("[FrameMonitor] Stopped video frame monitoring");
        }
    }

    addUser(uid) {
        if (!this.monitoredUsers.has(uid)) {
            this.monitoredUsers.set(uid, {
                lastFrameCount: 0,
                consecutiveZeroFrames: 0,
                isStalled: false
            });
            console.log(`[FrameMonitor] Added user ${uid} to monitoring`);
        }
    }

    removeUser(uid) {
        this.monitoredUsers.delete(uid);
        console.log(`[FrameMonitor] Removed user ${uid} from monitoring`);
    }

    async checkAllUsers() {
        if (!this.rtcClient || !this.rtcClient.client) return;

        for (const [uid, state] of this.monitoredUsers.entries()) {
            try {
                const stats = await this.rtcClient.client.getRemoteVideoStats();
                const userStats = stats[uid];

                if (userStats) {
                    const currentFrameCount = userStats.receiveFrameRate || 0;

                    // TEMPORARY DEBUG
                    this._showDebug(`User ${uid}: ${currentFrameCount} fps`);

                    // Frame rate is 0 (stalled)
                    if (currentFrameCount === 0) {
                        state.consecutiveZeroFrames++;

                        // If stalled for 2 checks (4 seconds) and not already showing overlay
                        if (state.consecutiveZeroFrames >= 2 && !state.isStalled) {
                            console.log(`[FrameMonitor] User ${uid} video stalled, showing overlay`);
                            this._showDebug(`🚫 STALLED! Showing overlay`);
                            this.remoteParticipantManager.showAwayOverlay(uid);
                            state.isStalled = true;
                        }
                    }
                    // Frame rate recovered
                    else if (currentFrameCount > 0 && state.isStalled) {
                        console.log(`[FrameMonitor] User ${uid} video resumed, removing overlay`);
                        this._showDebug(`✅ RESUMED! Removing overlay`);
                        this.remoteParticipantManager.removeAwayOverlay(uid);
                        state.isStalled = false;
                        state.consecutiveZeroFrames = 0;
                    }
                    // Reset counter if frames are coming
                    else if (currentFrameCount > 0) {
                        state.consecutiveZeroFrames = 0;
                    }
                } else {
                    this._showDebug(`No stats for user ${uid}`);
                }
            } catch (e) {
                console.warn(`[FrameMonitor] Error checking stats for user ${uid}:`, e);
                this._showDebug(`ERROR: ${e.message}`);
            }
        }
    }

    // TEMPORARY DEBUG HELPER
    _showDebug(message) {
        let debugBox = document.getElementById('frame-monitor-debug');
        if (!debugBox) {
            debugBox = document.createElement('div');
            debugBox.id = 'frame-monitor-debug';
            debugBox.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 100, 255, 0.9);
                color: white;
                padding: 10px;
                border-radius: 8px;
                z-index: 999999;
                max-width: 300px;
                font-size: 12px;
                line-height: 1.4;
            `;
            document.body.appendChild(debugBox);
        }
        debugBox.innerHTML = `<strong>FRAME MONITOR:</strong><br>${message}<br><small>${new Date().toLocaleTimeString()}</small>`;
    }
}
