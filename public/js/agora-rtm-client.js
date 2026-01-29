/**
 * Agora RTM Client
 * Handles Real-time Messaging and Presence (User List).
 */
export class AgoraRTMClient {
    constructor(appId, uid) {
        this.appId = appId;
        this.uid = uid;
        this.client = null;
        this.connected = false;

        // Event callbacks
        this.onPresence = null;
        this.onMessage = null;
    }

    async init(RTM_CLASS, token, nickname, channelName, callbacks) {
        this.onPresence = callbacks.onPresence;
        this.onMessage = callbacks.onMessage;

        try {
            this.client = new RTM_CLASS(this.appId, this.uid.toString());
            await this.client.login({ token });
            await this.client.setLocalUserAttributes({ nickname });
            this.connected = true;
            console.log("[RTM] Logged in");

            await this.client.subscribe(channelName, { withPresence: true, withMessage: true });
            console.log("[RTM] Subscribed to channel");

            this.bindEvents();
            return true;
        } catch (error) {
            console.error("[RTM] Init Failed:", error);
            this.connected = false;
            return false;
        }
    }

    bindEvents() {
        this.client.on("presence", (e) => {
            if (this.onPresence) this.onPresence(e);
        });

        this.client.on("message", (e) => {
            if (e.channelType !== "MESSAGE") return;
            const msg = (e.message instanceof Uint8Array) ? new TextDecoder().decode(e.message) : e.message;
            if (this.onMessage) this.onMessage(msg, e.publisher);
        });
    }

    async getOnlineUsers(channelName) {
        if (!this.connected) return [];
        try {
            const members = await this.client.getOnlineUsers(channelName);
            return members.occupants || [];
        } catch (e) {
            console.error("[RTM] Failed to get online users:", e);
            return [];
        }
    }

    async publish(channelName, message) {
        if (!this.connected) return;
        try {
            await this.client.publish(channelName, message, { channelType: "MESSAGE" });
        } catch (e) {
            console.warn("[RTM] Publish failed:", e);
            throw e;
        }
    }
}
