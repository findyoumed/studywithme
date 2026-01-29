/**
 * live-manager.js
 * Main Controller for Live Interactions
 * Coordinates AgoraRTCClient, AgoraRTMClient, and UI.
 */
import { RemoteParticipantManager } from './remote-participant-manager.js?v=38';
import { LiveUIManager } from './live-ui-manager.js?v=38';
import { AgoraRTCClient } from './agora-rtc-client.js?v=38';
import { AgoraRTMClient } from './agora-rtm-client.js?v=38';

const APP_ID = "13c86a022ad94066b4b21e03735595ee";

// --- State ---
let rtcClient = null;
let rtmClient = null;
let isLive = false;
let channelName = "study-room-default";
let myUID = Math.floor(100000 + Math.random() * 900000);
let userNickname = "Anonymous User";
let participantsMap = new Map();

// --- Modules ---
let remoteParticipantManager = null;
let liveUIManager = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log("Live Manager Initializing...");

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
    localStorage.setItem('study_nickname_auto', userNickname);

    // Initialize Modules
    rtcClient = new AgoraRTCClient(APP_ID);
    rtmClient = new AgoraRTMClient(APP_ID, myUID);

    remoteParticipantManager = new RemoteParticipantManager(participantsMap);
    liveUIManager = new LiveUIManager({
        toggleLive,
        startBroadcasting,
        isLive,
        channelName,
        rtmClient: rtmClient.client, // Pass raw client if needed by UI, or refactor UI to use wrapper
        showFloatingEmoji: (emoji) => console.log(emoji)
    });
    liveUIManager.init();

    // Expose localTracks for CameraManager (backward compatibility)
    window.localTracks = rtcClient.localTracks;
    window.isLive = false;

    if (urlParams.get('mode') === 'viewer') {
        document.body.classList.add('viewer-mode');
    }

    await setupSDKs(urlParams.get('mode') === 'viewer');
}

async function setupSDKs(isViewer) {
    // Setup RTC
    rtcClient.init({
        onUserPublished: handleUserPublished,
        onUserUnpublished: handleUserUnpublished,
        onUserJoined: handleUserJoined,
        onUserLeft: handleUserUnpublished
    });

    // Setup RTM
    if (!isViewer) {
        const RTM_SDK = await waitForRTM();
        if (RTM_SDK) {
            const { rtmToken } = await fetchTokens("subscriber");
            const success = await rtmClient.init(
                RTM_SDK.RTM,
                rtmToken,
                userNickname,
                channelName,
                {
                    onPresence: handlePresenceEvent,
                    onMessage: handleRTMMessage
                }
            );
            if (success) refreshParticipants();
        } else {
            console.warn("RTM SDK not found, features disabled.");
        }
    }

    // Join RTC
    const { rtcToken } = await fetchTokens("publisher");
    await rtcClient.join(channelName, rtcToken, myUID);
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

async function handleUserPublished(user, mediaType) {
    if (mediaType === 'video') {
        remoteParticipantManager.addParticipant(user);
    }
}

function handleUserUnpublished(user) {
    remoteParticipantManager.removeParticipant(user);
}

function handleUserJoined(user) {
    if (user.hasVideo) {
        handleUserPublished(user, 'video');
    }
}

function handlePresenceEvent(e) {
    if (e.type === "SNAPSHOT") updateParticipantsList(e.snapshot);
    else if (e.type === "REMOTE_JOIN" || e.type === "REMOTE_LEAVE") refreshParticipants();
}

function handleRTMMessage(msg, publisher) {
    // Handle message content (e.g., emoji, score)
    // Logic can be expanded here or delegated
}

async function refreshParticipants() {
    const users = await rtmClient.getOnlineUsers(channelName);
    updateParticipantsList(users);
}

function updateParticipantsList(users) {
    const newMap = new Map();
    users.forEach(user => newMap.set(user.userId, user.states));
    participantsMap = newMap;
    // UI update logic if needed
}

// --- Broadcasting Control ---

async function toggleLive() {
    if (isLive) await stopBroadcasting();
    else await startBroadcasting();
}

async function startBroadcasting() {
    if (isLive) return;
    try {
        let videoTrack = window.cameraManager ? window.cameraManager.getVideoTrack() : null;
        if (!videoTrack || videoTrack.readyState === 'ended') {
            videoTrack = await rtcClient.createCameraTrack();
        }

        await rtcClient.publish(videoTrack);

        isLive = true;
        window.isLive = true;
        liveUIManager.updateButtonsUI(isLive);
        startScoreBroadcasting();
        console.log("Broadcasting started.");
    } catch (e) {
        console.error("Start broadcasting failed:", e);
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

function startScoreBroadcasting() {
    if (window.scoreBroadcastInterval) return;
    window.scoreBroadcastInterval = setInterval(async () => {
        if (rtmClient.connected && window.motionManager) {
            const score = window.motionManager.getScore();
            const payload = JSON.stringify({ type: 'SCORE', value: score });
            try {
                await rtmClient.publish(channelName, payload);
            } catch (e) {
                console.warn("Score publish failed.");
                stopScoreBroadcasting();
            }
        }
    }, 1000);
}

function stopScoreBroadcasting() {
    clearInterval(window.scoreBroadcastInterval);
    window.scoreBroadcastInterval = null;
}

// --- API ---

async function fetchTokens(role) {
    try {
        const response = await fetch(`/api/get-agora-token?channelName=${channelName}&uid=${myUID}&role=${role}`);
        if (!response.ok) throw new Error(`Token fetch error: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error(e);
        return {};
    }
}
