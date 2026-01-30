/**
 * Agora RTC Client
 * Handles Video/Audio broadcasting and subscription.
 */
export class AgoraRTCClient {
    constructor(appId) {
        this.appId = appId;
        this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        this.localTracks = { videoTrack: null };
        this.remoteUsers = new Map(); // uid -> user

        // Event callbacks
        this.onUserPublished = null;
        this.onUserUnpublished = null;
        this.onUserJoined = null;
        this.onUserLeft = null;
    }

    init(callbacks) {
        this.onUserPublished = callbacks.onUserPublished;
        this.onUserUnpublished = callbacks.onUserUnpublished;
        this.onUserJoined = callbacks.onUserJoined;
        this.onUserLeft = callbacks.onUserLeft;

        this.bindEvents();
    }

    bindEvents() {
        this.client.on("user-published", async (user, mediaType) => {
            await this.client.subscribe(user, mediaType);
            if (this.onUserPublished) this.onUserPublished(user, mediaType);
        });

        this.client.on("user-unpublished", (user) => {
            if (this.onUserUnpublished) this.onUserUnpublished(user);
        });

        this.client.on("user-joined", (user) => {
            if (this.onUserJoined) this.onUserJoined(user);
        });

        this.client.on("user-left", (user) => {
            if (this.onUserLeft) this.onUserLeft(user);
        });

        this.client.on("exception", (e) => console.warn(`[RTC] Exception: ${e.code}`, e));
    }

    async join(channelName, token, uid) {
        try {
            await this.client.join(this.appId, channelName, token, uid);
            console.log("[RTC] Joined channel successfully");
            return true;
        } catch (error) {
            console.error("[RTC] Failed to join:", error);
            return false;
        }
    }

    // [LOG: 20260129_1942] 라이브 버튼 에러 수정: Agora track 감지 로직 수정
    async publish(videoTrack) {
        try {
            console.log('[RTC] publish() called with videoTrack:', videoTrack);
            console.log('[RTC] videoTrack type:', typeof videoTrack);

            // videoTrack이 null이거나 유효하지 않으면 새로 생성
            if (!videoTrack) {
                console.log('[RTC] No video track provided, creating new camera track...');
                this.localTracks.videoTrack = await this.createCameraTrack();
            }
            // Agora SDK track인지 확인 (trackMediaType 속성이 있으면 Agora track)
            else if (videoTrack.trackMediaType !== undefined) {
                console.log('[RTC] Already an Agora SDK track, using directly');
                this.localTracks.videoTrack = videoTrack;
            }
            // raw MediaStreamTrack인 경우
            else if (videoTrack.kind === 'video') {
                console.log('[RTC] Creating custom video track from raw MediaStreamTrack');
                console.log('[RTC] videoTrack.readyState:', videoTrack.readyState);
                this.localTracks.videoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
            }
            // 알 수 없는 형식
            else {
                console.error('[RTC] Unknown track type, creating new camera track');
                this.localTracks.videoTrack = await this.createCameraTrack();
            }

            await this.client.publish([this.localTracks.videoTrack]);
            console.log("[RTC] Published video track successfully");
            return this.localTracks.videoTrack;
        } catch (e) {
            console.error("[RTC] Publish failed:", e);
            throw e;
        }
    }

    async unpublish() {
        try {
            if (this.localTracks.videoTrack) {
                // [LOG: 20260130_1411] If it's an Agora track wrapping a cloned MediaStreamTrack,
                // we must stop the underlying track to release the hardware correctly.
                const mediaTrack = this.localTracks.videoTrack.getMediaStreamTrack
                    ? this.localTracks.videoTrack.getMediaStreamTrack()
                    : null;

                if (mediaTrack && typeof mediaTrack.stop === 'function') {
                    mediaTrack.stop();
                }

                if (typeof this.localTracks.videoTrack.close === 'function') {
                    this.localTracks.videoTrack.close();
                }
                this.localTracks.videoTrack = null;
            }
            await this.client.unpublish();
            console.log("[RTC] Unpublished");
        } catch (e) {
            console.error("[RTC] Unpublish failed:", e);
        }
    }

    async createCameraTrack() {
        return await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_1" });
    }
}
