/**
 * live-manager.js (RESTORED STABLE VERSION)
 * Main Controller for Live Interactions
 * Coordinates AgoraRTCClient, AgoraRTMClient, and UI.
 */
import { RemoteParticipantManager } from './remote-participant-manager.js?v=38';
import { LiveUIManager } from './live-ui-manager.js?v=38';
import { AgoraRTCClient } from './agora-rtc-client.js?v=38';
// import { AgoraRTMClient } from './agora-rtm-client.js?v=38';

const APP_ID = "13c86a022ad94066b4b21e03735595ee";

// --- State ---
let rtcClient = null;
let rtmClient = null;
let isLive = false;
let channelName = "study-room-default";

// UID Logic: Avoid collision when testing Host/Viewer in same browser
const urlParamsForID = new URLSearchParams(window.location.search);
let myUID = null;

if (urlParamsForID.get('mode') === 'viewer') {
    // Viewer always gets a random temporary UID
    myUID = Math.floor(100000 + Math.random() * 900000);
    console.log('👀 Viewer Mode: Generated temporary UID:', myUID);
} else {
    // Host uses persistent UID from storage
    myUID = localStorage.getItem('agora_uid');
    if (!myUID) {
        myUID = Math.floor(100000 + Math.random() * 900000);
        localStorage.setItem('agora_uid', myUID);
        console.log('🆕 Host Mode: New persistent UID created:', myUID);
    } else {
        myUID = parseInt(myUID);
        console.log('♻️ Host Mode: Reusing persistent UID:', myUID);
    }
}

let userNickname = "Anonymous User";
let participantsMap = new Map();
let remoteParticipantManager = null;
let liveUIManager = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log(`[LifeManager] 🚀 Initializing... Mode: ${urlParamsForID.get('mode') || 'HOST'}, UID: ${myUID}`);


    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('room')) {
        const randomRoomId = 'room-' + Math.random().toString(36).substring(2, 9);
        urlParams.set('room', randomRoomId);
        urlParams.set('host', 'true');
        window.location.search = urlParams.toString();
        return;
    }
    channelName = urlParams.get('room');
    userNickname = localStorage.getItem('study_nickname_auto') || userNickname;

    // Initialize Modules
    rtcClient = new AgoraRTCClient(APP_ID);
    // rtmClient = new AgoraRTMClient(APP_ID, myUID);
    rtmClient = { client: null }; // Dummy object to prevent crash in UI manager
    remoteParticipantManager = new RemoteParticipantManager(participantsMap);

    // Global Expose
    window.liveManager = { rtcClient, rtmClient, isLive: () => isLive, channelName, myUID };
    window.rtcClient = rtcClient;

    liveUIManager = new LiveUIManager({
        toggleLive,
        startBroadcasting,
        getIsLive: () => isLive,
        channelName,
        rtmClient: rtmClient.client,
        showFloatingEmoji: (emoji) => console.log(emoji)
    });
    liveUIManager.init();

    window.localTracks = rtcClient.localTracks;
    window.isLive = false;

    if (urlParams.get('mode') === 'viewer') {
        document.body.classList.add('viewer-mode');
    } else {
        // [LOG: 20260130_1046] Reset score on host load
        const roomId = channelName;
        try {
            await fetch(`/api/room/${roomId}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: 0 })
            });
        } catch (e) {
            // Silent fail
        }
    }

    await setupSDKs(urlParams.get('mode') === 'viewer');
}

async function setupSDKs(isViewer) {
    // Setup RTC
    rtcClient.init({
        onUserPublished: async (user, mediaType) => {
            console.log(`[LiveManager] User published: ${user.uid}, media: ${mediaType}`);
            if (mediaType === 'video') remoteParticipantManager.addParticipant(user);
        },
        onUserUnpublished: (user) => {
            console.log(`[LiveManager] User unpublished: ${user.uid}`);
            remoteParticipantManager.removeParticipant(user);
        },
        onUserJoined: (user) => {
            console.log(`[LiveManager] User joined: ${user.uid}`);
            if (user.hasVideo) remoteParticipantManager.addParticipant(user);
        },
        onUserLeft: (user) => remoteParticipantManager.removeParticipant(user)
    });

    // [USER REQUEST] Disable RTM to silence console errors - Using HTTP Fallback only
    /*
    // Setup RTM (for both Host and Viewer to receive scores)
    const RTM_SDK = await waitForRTM();
    if (RTM_SDK) {
        const { rtmToken } = await fetchTokens("subscriber");
        await rtmClient.init(RTM_SDK.RTM, rtmToken, userNickname, channelName, {
            onPresence: handlePresenceEvent,
            onMessage: handleRTMMessage
        });
        if (!isViewer) {
            refreshParticipants(); // Only host refreshes participants
        }
    }
    */


    // Join RTC (Immediately upon load)
    const { rtcToken } = await fetchTokens("publisher");
    await rtcClient.join(channelName, rtcToken, myUID);

    // [LOG: 20260130_1100] Ensure clean state: explicitly unpublish to clear stale server state
    // [LOG: 20260130_1100] Ensure clean state: explicitly unpublish to clear stale server state
    if (!isViewer) {
        try {
            await rtcClient.unpublish();
        } catch (e) {
            // Ignore error if already unpublished
        }
    }

    // [LOG: 20260130_1116] Auto-start broadcast if viewers are present
    if (!isViewer) {
        try {
            const response = await fetch(`/api/room-status?channelName=${channelName}`);
            const data = await response.json();
            // Count includes self, so > 1 means at least one other person (viewer)
            if (data.currentParticipants > 1) {
                console.log(`[LiveManager] Viewers detected (${data.currentParticipants}), auto-starting broadcast...`);
                await startBroadcasting();
            }
        } catch (e) {
            console.warn("[LiveManager] Failed to check room status for auto-start:", e);
        }
    }
}

async function waitForRTM() {
    let retries = 0;
    while (!window.AgoraRTM && !window.agoraRTM && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
    }
    return window.agoraRTM || window.AgoraRTM;
}

// --- Event Handlers ---
function handlePresenceEvent(e) {
    if (e.type === "SNAPSHOT") {
        const newMap = new Map();
        e.snapshot.forEach(user => newMap.set(user.userId, user.states));
        participantsMap = newMap;
    } else if (e.type === "REMOTE_JOIN" || e.type === "REMOTE_LEAVE") {
        refreshParticipants();
    }
}

function handleRTMMessage(msg, publisher) {
    try {
        const text = msg.messageType === 'TEXT' ? msg.text : msg; // Handle both types
        const data = JSON.parse(text);

        if (data.type === 'SCORE') {
            const uid = publisher; // The UID of the sender
            remoteParticipantManager.updateScore(uid, data.value);

            // [LOG: 20260130_1025] Update viewer score display
            if (window.updateViewerScore) {
                window.updateViewerScore(data.value);
            }
        }
    } catch (e) {
        // Not a JSON message or other error, ignore
    }
}

async function refreshParticipants() {
    const users = await rtmClient.getOnlineUsers(channelName);
    const newMap = new Map();
    users.forEach(user => newMap.set(user.userId, user.states));
    participantsMap = newMap;
}

// --- Broadcasting Control ---
async function toggleLive() {
    if (isLive) await stopBroadcasting();
    else await startBroadcasting();
}

async function startBroadcasting() {
    if (isLive) return;
    try {
        // [LOG: 20260130_1406] Use existing camera track to avoid hardware conflict on mobile
        let videoTrack = null;
        if (window.cameraManager && typeof window.cameraManager.getVideoTrack === 'function') {
            const originalTrack = window.cameraManager.getVideoTrack();
            if (originalTrack) {
                // [LOG: 20260130_1411] Clone the track to prevent the original video from freezing.
                // Cloning creates a separate instance that doesn't affect the source <video> element.
                videoTrack = originalTrack.clone();
                console.log("[LiveManager] Using cloned track for broadcast to protect original video");
            }
        }

        // If no focus camera active, then create a new one
        if (!videoTrack) {
            console.log("[LiveManager] No focus camera, creating new one");
            videoTrack = await rtcClient.createCameraTrack();
        }

        await rtcClient.publish(videoTrack);

        isLive = true;

        // Final insurance for video element playback
        const localVideo = document.getElementById('camera');
        if (localVideo && localVideo.paused) {
            localVideo.play().catch(() => { });
        }
        window.isLive = true;
        liveUIManager.updateButtonsUI(isLive);
        startScoreBroadcasting();
        console.log("Broadcasting started.");
    } catch (e) {
        console.error("Start broadcasting failed:", e);
        // Localized Error Message
        const savedLang = localStorage.getItem("studywithme_lang");
        const navLang = navigator.language || 'en';
        const browserLang = navLang.startsWith('ko') ? 'ko' : 'en';
        const currentLang = savedLang || browserLang;
        const msg = currentLang === 'ko'
            ? "방송 연결 중입니다. 지금 다시 시도해주세요."
            : "Broadcast is connecting. Please try again now.";
        alert(msg);
    }
}

async function stopBroadcasting() {
    if (!isLive) return;
    try {
        await rtcClient.unpublish();
        isLive = false;
        window.isLive = false;
        liveUIManager.updateButtonsUI(isLive);
        stopScoreBroadcasting();
        console.log("Broadcasting stopped.");
    } catch (e) {
        console.error("Stop broadcasting failed:", e);
    }
}

// --- Score Broadcasting ---
// --- Use ScoreBroadcaster Module ---
import { ScoreBroadcaster } from "./live/score-broadcaster.js";
const scoreBroadcaster = new ScoreBroadcaster();

function startScoreBroadcasting() {
    scoreBroadcaster.start(channelName, rtmClient, { isViewer: urlParamsForID.get('mode') === 'viewer', myUID: myUID });
}

function stopScoreBroadcasting() {
    scoreBroadcaster.stop();
}
// --- API (Inline to Restore Stability) ---
async function fetchTokens(role) {
    const endpoint = `/api/get-agora-token?channelName=${channelName}&uid=${myUID}&role=${role}`;
    const response = await fetch(endpoint);
    return await response.json();
}

window.addEventListener('beforeunload', async () => {
    try {
        await fetch('/api/participant-left', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelName, uid: myUID }),
            keepalive: true
        });
    } catch (e) { }
});
