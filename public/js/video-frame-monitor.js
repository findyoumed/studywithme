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

                    // Frame rate is 0 (stalled)
                    if (currentFrameCount === 0) {
                        state.consecutiveZeroFrames++;

                        // If stalled for 2 checks (4 seconds) and not already showing overlay
                        if (state.consecutiveZeroFrames >= 2 && !state.isStalled) {
                            console.log(`[FrameMonitor] User ${uid} video stalled, showing overlay`);
                            this.remoteParticipantManager.showAwayOverlay(uid);
                            state.isStalled = true;
                        }
                    }
                    // Frame rate recovered
                    else if (currentFrameCount > 0 && state.isStalled) {
                        console.log(`[FrameMonitor] User ${uid} video resumed, removing overlay`);
                        this.remoteParticipantManager.removeAwayOverlay(uid);
                        state.isStalled = false;
                        state.consecutiveZeroFrames = 0;
                    }
                    // Reset counter if frames are coming
                    else if (currentFrameCount > 0) {
                        state.consecutiveZeroFrames = 0;
                    }
                }
            } catch (e) {
                console.warn(`[FrameMonitor] Error checking stats for user ${uid}:`, e);
            }
        }
    }
}
