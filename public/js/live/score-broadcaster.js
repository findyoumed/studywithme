export class ScoreBroadcaster {
    constructor() {
        this.scoreBroadcastInterval = null;
    }

    start(channelName, rtmClient, options = {}) {
        if (this.scoreBroadcastInterval) return;

        const { isViewer = false } = options;

        // Host: Broadcasts score to server
        // Viewer: Just reads score (handled by viewer-score-display.js usually, but here we might do RTM fallback if needed)
        // Actually, in the current logic, Host POSTs score.

        console.log("[ScoreBroadcaster] Starting score broadcast loop...");
        this.scoreBroadcastInterval = setInterval(async () => {
            if (!window.motionManager) return; // Wait for motion manager

            // 1. Get current score
            const currentScore = window.motionManager.getScore();

            // 2. Host: Send to Server (HTTP)
            if (!isViewer && channelName) {
                try {
                    await fetch(`/api/room/${channelName}/score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: currentScore })
                    });
                } catch (e) {
                    // Silent fail
                }
            }

            // [USER REQUEST] Disable RTM Score Broadcast
            /*
            // 3. Host: Send via RTM (Legacy/Backup for real-time overlays)
            if (!isViewer && rtmClient && channelName) {
                try {
                    const msg = JSON.stringify({
                        type: "SCORE_UPDATE",
                        uid: options.myUID,
                        score: currentScore
                    });
                    await rtmClient.publish(channelName, msg);
                } catch (e) {
                    // RTM might fail if not connected, ignore
                }
            }
            */


        }, 1000);
    }

    stop() {
        if (this.scoreBroadcastInterval) {
            clearInterval(this.scoreBroadcastInterval);
            this.scoreBroadcastInterval = null;
            console.log("[ScoreBroadcaster] Stopped.");
        }
    }
}
