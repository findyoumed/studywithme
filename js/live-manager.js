/**
 * live-manager.js
 * Manages Agora RTC (Video) and RTM (Messaging/Presence) connections
 * Optimized for reliability and automatic viewing.
 */

const APP_ID = "13c86a022ad94066b4b21e03735595ee"; 

// RTC Client
const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let rtmClient = null;

// Agora RTM Safety Check - Global
let RTM_CLASS = null;

let localTracks = { videoTrack: null };
let isLive = false;
window.isLive = false; // Initialize global state early
let channelName = "study-room-default";
let myUID = Math.floor(100000 + Math.random() * 900000); // Numeric UID for Agora

// Random Animal Nicknames
const animals = ["강아지", "고양이", "토끼", "다람쥐", "판다", "펭귄", "햄스터", "쿼카", "나무늘보", "아기사자"];
const adjectives = ["열공하는", "잠오는", "행복한", "똑똑한", "조용한", "차분한", "활기찬", "졸린", "꿈꾸는"];

function generateNickname() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj} ${animal}`;
}

let userNickname = localStorage.getItem('study_nickname_auto') || generateNickname();
localStorage.setItem('study_nickname_auto', userNickname);

// Participant data
let participantsMap = new Map(); 

// DOM Elements
const btnGoLive = document.getElementById('btnGoLive');
const liveStatus = document.getElementById('liveStatus');
const remoteVideoContainer = document.getElementById('remoteVideoContainer');
const roomNameDisplay = document.getElementById('roomNameDisplay');
const btnCopyRoom = document.getElementById('btnCopyRoom');
const btnShowParticipants = document.getElementById('btnShowParticipants');
const participantCountDisplay = document.getElementById('participantCount');
const participantSidebar = document.getElementById('participantSidebar');
const btnCloseSidebar = document.getElementById('btnCloseSidebar');
const participantListUI = document.getElementById('participantList');
const emojiBar = document.getElementById('emojiBar');
const reactionContainer = document.getElementById('reactionContainer');

/**
 * Initialization
 */
async function init() {
    console.log("Live Manager Initializing...");
    
    // 1. Setup Room
    // 1. Setup Room
    const urlParams = new URLSearchParams(window.location.search);
    
    // Auto-generate Random Room ID if missing
    if (!urlParams.has('room')) {
        const randomRoomId = 'room-' + Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 9);
        // Redirect to new room as Host
        urlParams.set('room', randomRoomId);
        urlParams.set('host', 'true');
        window.location.search = urlParams.toString();
        return; // Stop execution until reload
    }

    if (urlParams.get('room')) channelName = urlParams.get('room');
    console.log(`[LiveManager] Current Room: ${channelName}, Mode: ${urlParams.get('mode') || 'Host'}`);
    
    if (roomNameDisplay) roomNameDisplay.innerText = channelName;

    // 1.5 View Mode Check
    if (urlParams.get('mode') === 'viewer') {
        document.body.classList.add('viewer-mode');
        
        // Programmatically remove elements hidden by CSS to "clean" the DOM as requested
        const selectorsToRemove = [
            '.top-left-controls',
            '.next-video-bar',
            '.sidebar-header', 
            '#participantSidebar',
            '#controlsContainer',
            '.video-panel',
            '#placeholder',
            '#btnGoLive', // Specific button removal
            '#btnCopyRoom' // Access via ID
        ];
        
        selectorsToRemove.forEach(selector => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => el.remove());
        });
    }

    // 2. Host Check
    const isHost = urlParams.get('host') === 'true' || urlParams.get('host') === '1';
    if (!isHost && btnGoLive) {
        btnGoLive.style.display = 'none';
    }

    // 3. Setup SDKs
    await setupSDKs();
}

async function setupSDKs() {
    // Check if RTM exists (it might be window.agoraRTM or window.AgoraRTM depending on version)
    const RTM_SDK = window.agoraRTM || window.AgoraRTM;
    if (RTM_SDK) {
        RTM_CLASS = RTM_SDK.RTM;
        await initRTM();
    } else {
        console.error("AgoraRTM SDK not found. Emojis and list will be disabled.");
    }
    
    // Always join RTC
    await joinRTC();
}

/**
 * Initialize RTM
 */
async function initRTM() {
    try {
        const { rtmToken } = await fetchTokens("subscriber");
        rtmClient = new RTM_CLASS(APP_ID, myUID.toString());
        await rtmClient.login({ token: rtmToken });
        await rtmClient.setLocalUserAttributes({ nickname: userNickname });
        
        // Update Status Indicator
        const statusEl = document.querySelector('.status-indicator');
        if (statusEl) {
            statusEl.innerText = 'Connected';
            statusEl.classList.add('connected');
        }

        // Use standard subscribe
        try {
            // Agora RTM 2.x subscribe signature: subscribe(channelName, options)
            // Options: { withMessage: boolean, withMetadata: boolean, withPresence: boolean, withLock: boolean }
            await rtmClient.subscribe(channelName, { 
                withPresence: true, 
                withMessage: true, 
                withMetadata: true 
            });
            console.log("Subscribed to channel with presence");
        } catch (e) {
            console.error("RTM Subscribe Failed:", e);
        }
        
        // const streamChannel = rtmClient.createStreamChannel(channelName);
        // await streamChannel.join({ token: rtmToken, withMetadata: true, withPresence: true });

        rtmClient.on("presence", (event) => {
            console.log("RTM Presence Event:", event.type, event);
            if (event.type === "SNAPSHOT") {
                updateParticipantsList(event.snapshot);
            }
            else if (event.type === "REMOTE_JOIN" || event.type === "REMOTE_LEAVE") {
                console.log(`User ${event.type}: ${event.publisherId || 'unknown'}`);
                refreshParticipants();
            }
        });

        rtmClient.on("message", (event) => {
            console.log("[RTM] Raw Event:", event); 
            // Check for Channel Message
            if (event.channelType === "MESSAGE" && event.channelName === channelName) {
                let msgString;
                // Handle Uint8Array or String
                if (typeof event.message === 'string') {
                    msgString = event.message;
                } else if (event.message instanceof Uint8Array) {
                    msgString = new TextDecoder().decode(event.message);
                } else {
                    console.log("Unknown message type:", event.message);
                    return;
                }

                console.log("[RTM] Decoded Message:", msgString);

                try {
                    // Check if it's a simple string first (legacy emoji)
                    if (!msgString.startsWith('{')) {
                        showFloatingEmoji(msgString);
                        return;
                    }

                    const data = JSON.parse(msgString);
                    if (data.type === 'EMOJI') {
                        showFloatingEmoji(data.value);
                    } else if (data.type === 'SCORE') {
                        updateHostScoreUI(data.value);
                    }
                } catch (e) {
                    // Fallback for raw string emojis just in case
                    showFloatingEmoji(msgString);
                }
            }
        });

        refreshParticipants();
    } catch (error) {
        console.error("RTM Init Failed:", error);
    }
}

/**
 * Join RTC channel
 * We join as publisher role by default to simplify things, 
 * but we don't start the camera until Go Live is clicked.
 */
async function joinRTC() {
    try {
        const { rtcToken } = await fetchTokens("publisher");
        await rtcClient.join(APP_ID, channelName, rtcToken, myUID);
        console.log("Joined RTC channel successfully");
    } catch (error) {
        console.error("Failed to join RTC:", error);
    }
}

async function refreshParticipants() {
    try {
        const response = await rtmClient.getOnlineUsers(channelName);
        console.log("Online Users Fetch Result:", response);
        // Agora SDK v2 structure might be { users: [...], occupants: [...] } depending on version
        // Let's assume response.occupants or response itself is the list if V2.
        // Actually for V2 'getOnlineUsers' usually returns { totalOccupants: number, occupants: array }
        
        const members = response.occupants || [];
        updateParticipantsList(members);
    } catch (e) {
        console.error("Failed to refresh participants:", e);
    }
}

function updateParticipantsList(members) {
    if (!participantListUI) return;
    participantListUI.innerHTML = "";
    if (participantCountDisplay) participantCountDisplay.innerText = members.length;

    members.forEach(member => {
        const li = document.createElement("li");
        li.className = "participant-item";
        const nickname = member.attributes?.nickname || "알 수 없는 친구";
        const isMe = member.userId === myUID.toString();
        li.innerHTML = `
            <div class="participant-avatar">${nickname.split(' ').pop().charAt(0)}</div>
            <div class="participant-name">${nickname} ${isMe ? "(나)" : ""}</div>
        `;
        participantListUI.appendChild(li);
        participantsMap.set(member.userId, nickname);
    });
}

function showFloatingEmoji(emoji) {
    if (!reactionContainer) return;

    // Zoom-like effect:
    // 1. Start from random X position near the bottom right (or center depending on layout)
    // 2. Float UP with some random wiggle
    // 3. Fade out near the top

    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.innerText = emoji;

    // Randomize starting X (spread across the container width)
    // Container is likely fixed at bottom right, let's use its width
    const startX = Math.random() * 80 + 10; // 10% to 90%
    
    // Randomize size for variety
    const scale = 0.8 + Math.random() * 0.8; // 0.8x to 1.6x

    // Randomize duration
    const duration = 2 + Math.random() * 2; // 2s to 4s

    // Randomize wiggle intensity
    const wiggle = (Math.random() - 0.5) * 50; 

    el.style.left = `${startX}%`;
    el.style.fontSize = `${32 * scale}px`;
    el.style.animationDuration = `${duration}s`;
    el.style.setProperty('--wiggle-x', `${wiggle}px`);

    reactionContainer.appendChild(el);

    // Remove after animation completes
    setTimeout(() => el.remove(), duration * 1000);
}

function updateHostScoreUI(seconds) {
    const el = document.getElementById('hostScoreDisplay');
    const valEl = document.getElementById('hostScoreValue');
    if (el && valEl) {
        el.style.display = 'flex';
        // Format seconds to HH:MM:SS
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        valEl.innerText = `${h}:${m}:${s}`;
    }
}

async function fetchTokens(role) {
    // If we are host, role is publisher. If viewer, role is subscriber.
    // However, the token generation usually just needs valid UID. Role separation is good practice.
    const urlParams = new URLSearchParams(window.location.search);
    const isHost = urlParams.get('host') === 'true' || urlParams.get('host') === '1';
    
    // Force role 'start' (publisher) if host, 'join' (subscriber) if not?
    // Actually our server logic might be simple. Let's send what we intend.
    // If I am NOT a host, I shoudln't ask for publisher token?
    // But currently loop calls this with fixed strings. Let's trust the Caller or override.
    
    // For RTM, role doesn't matter much. 
    // For RTC, only host needs publisher token.
    const actualRole = isHost ? 'publisher' : 'subscriber';

    const response = await fetch(`/api/get-agora-token?channelName=${channelName}&uid=${myUID}&role=${actualRole}`);
    return await response.json();
}

/**
 * Broadcasting Logic
 */
async function toggleLive() {
    if (isLive) await stopBroadcasting();
    else await startBroadcasting();
}

// Expose state for automation
window.isLive = isLive;
window.startBroadcasting = startBroadcasting;

async function startBroadcasting() {
    try {
        window.isLive = true; // Sync global state
        btnGoLive.disabled = true;
        
        // Start Camera
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_1"
        });

        const localPreview = document.getElementById('localVideoPreview');
        if (localPreview) localTracks.videoTrack.play(localPreview);
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';

        // Publish
        await rtcClient.publish([localTracks.videoTrack]);
        
        isLive = true;
        updateButtonsUI();
        console.log("Broadcasting started!");
        
        // Start Score Broadcasting Loop (every 1s)
        if (!window.scoreBroadcastInterval) {
            window.scoreBroadcastInterval = setInterval(async () => {
                // Check if MotionManager is available (only on Host)
                if (window.motionManager) {
                    const currentScore = window.motionManager.getScore();
                    // Basic logging to confirm it sends
                    console.log(`[Host] Broadcasting Score: ${currentScore}`);
                    
                    const payload = JSON.stringify({ type: 'SCORE', value: currentScore });
                    try {
                        if (rtmClient) {
                            await rtmClient.publish(channelName, payload, { channelType: "MESSAGE" });
                        }
                    } catch (e) { console.error("Score Publish Failed", e); }
                } else {
                    // This is expected on Viewer, but if this logs on Host, we have an issue.
                    // console.log("MotionManager not found (Normal for Viewer)");
                }
            }, 1000);
        }
    } catch (error) {
        console.error("Start broadcasting failed:", error);
        alert("카메라를 켤 수 없습니다. 권한을 확인해주세요.");
    } finally {
        btnGoLive.disabled = false;
    }
}

async function stopBroadcasting() {
    try {
        if (localTracks.videoTrack) {
            localTracks.videoTrack.stop(); 
            localTracks.videoTrack.close();
            localTracks.videoTrack = null;
        }
        await rtcClient.unpublish();

        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'flex';
        
        if (window.scoreBroadcastInterval) {
            clearInterval(window.scoreBroadcastInterval);
            window.scoreBroadcastInterval = null;
        }
        
        isLive = false;
        window.isLive = false; // Sync global state
        
        updateButtonsUI();
        console.log("Broadcasting stopped.");
    } catch (error) {
        console.error("Stop broadcasting failed:", error);
    }
}

function updateButtonsUI() {
    if (isLive) {
        btnGoLive.classList.add('active');
        btnGoLive.innerHTML = '<span class="material-symbols-outlined">stop_circle</span>';
        liveStatus.style.display = 'flex';
        // emojiBar.style.display = 'flex'; // Host doesn't need to cheer for themselves
    } else {
        btnGoLive.classList.remove('active');
        btnGoLive.innerHTML = '<span class="material-symbols-outlined">podcasts</span>';
        liveStatus.style.display = 'none';
        emojiBar.style.display = 'none';
    }
    // Initial Grid Sync for viewers joining existing sessions
    updateGridCount();
}

function updateGridCount() {
    const container = document.getElementById('remoteVideoContainer');
    if (container) {
        const count = container.children.length;
        container.setAttribute('data-count', count);
        console.log(`[Grid] Updated participant count to: ${count}`);
    }
}

rtcClient.on("user-published", async (user, mediaType) => {
    await rtcClient.subscribe(user, mediaType);
    if (mediaType === "video") {
        const remotePlayerContainer = document.createElement("div");
        remotePlayerContainer.id = `user-${user.uid}`;
        remotePlayerContainer.className = "remote-video-player";
        const nickname = participantsMap.get(user.uid.toString()) || "알 수 없는 친구";
        remotePlayerContainer.innerHTML = `<div class="remote-video-label">${nickname}</div>`;
        remoteVideoContainer.append(remotePlayerContainer);
        // Explicitly format video: cover, NO mirror
        user.videoTrack.play(remotePlayerContainer, { fit: "cover", mirror: false });
        updateGridCount();
    }
});

rtcClient.on("user-published", async (user, mediaType) => {
    // Duplicate handler check? No, Agora SDK handles it but let's be clean.
});

rtcClient.on("user-unpublished", (user) => {
    const remotePlayerContainer = document.getElementById(`user-${user.uid}`);
    if (remotePlayerContainer) {
        remotePlayerContainer.remove();
        updateGridCount();
    }
});

// UI Event Listeners
if (btnGoLive) btnGoLive.addEventListener('click', toggleLive);

if (btnCopyRoom) {
    btnCopyRoom.addEventListener('click', async () => {
        // Auto Go Live if not already live
        if (!isLive && typeof startBroadcasting === 'function') {
            console.log("Auto-starting broadcast on share...");
            await startBroadcasting();
        }

        const url = new URL(window.location.href);
        url.searchParams.set('room', channelName);
        url.searchParams.delete('host'); // Ensure viewer link
        url.searchParams.set('mode', 'viewer'); // Add viewer mode implicitly
        navigator.clipboard.writeText(url.toString());
        const originalIcon = btnCopyRoom.innerHTML;
        btnCopyRoom.innerHTML = '<span class="material-symbols-outlined">check</span>';
        setTimeout(() => btnCopyRoom.innerHTML = originalIcon, 2000);
    });
}

if (btnShowParticipants) {
    btnShowParticipants.addEventListener('click', () => participantSidebar.classList.toggle('active'));
}

if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => participantSidebar.classList.remove('active'));
}

document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const emoji = btn.dataset.emoji;
        if (rtmClient) {
            try {
                await rtmClient.publish(channelName, emoji, { channelType: "MESSAGE" });
                showFloatingEmoji(emoji);
            } catch (e) {}
        }
    });
});

init();
/ /  
 g i t - t e s t  
 