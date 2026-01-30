/**
 * Viewer Go Live Functionality
 * Allows viewers to start their own broadcast WITHOUT cameraManager
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Viewer] Initializing Join & Share button...');

  const btnJoinShare = document.getElementById('btnJoinShare');

  if (!btnJoinShare) {
    console.warn('[Viewer] Join & Share button not found');
    return;
  }

  // 폰트 로드 후 버튼 표시 (FOUC 방지)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      btnJoinShare.classList.add('ready');
    });
  } else {
    setTimeout(() => {
      btnJoinShare.classList.add('ready');
    }, 100);
  }

  let isViewerLive = false;
  let localVideoStream = null;
  let localVideoTrack = null;

  // Language & Copy Helper
  function getLocalizedMessages() {
    const savedLang = localStorage.getItem("studywithme_lang");
    const navLang = navigator.language || 'en';
    const browserLang = navLang.startsWith('ko') ? 'ko' : 'en';
    const currentLang = savedLang || browserLang;

    if (currentLang === 'ko') {
      return {
        copiedAndStarting: '✅ 링크 복사 & 방송 시작 중...',
        stopped: '⏹️ 방송이 종료되었습니다',
        startError: '방송 시작 중 오류 발생: ',
        btnStop: 'Stop Live',
        btnStart: 'Join & Share',
        titleStop: '방송 종료',
        titleStart: '방송 참여 및 공유하기'
      };
    } else {
      return {
        copiedAndStarting: '✅ Link Copied & Starting Broadcast...',
        stopped: '⏹️ Broadcast stopped',
        startError: 'Error starting broadcast: ',
        btnStop: 'Stop Live',
        btnStart: 'Join & Share',
        titleStop: 'Stop Live',
        titleStart: 'Join & Share Link'
      };
    }
  }

  async function copyLink() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('host'); // Ensure clean link
      if (!url.searchParams.has('mode')) url.searchParams.set('mode', 'viewer');

      await navigator.clipboard.writeText(url.toString());

      // Visual Feedback
      btnJoinShare.classList.add('copied');
      setTimeout(() => btnJoinShare.classList.remove('copied'), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  }

  btnJoinShare.addEventListener('click', async () => {
    console.log('[Viewer] Join & Share clicked, current state:', isViewerLive);
    const msgs = getLocalizedMessages();

    try {
      if (!isViewerLive) {
        // ACTION: Start Logic
        // 1. Copy Link first
        await copyLink();

        // 2. Show Notification
        showNotification(msgs.copiedAndStarting);

        // 3. Start Broadcast
        await startViewerBroadcast(msgs);
      } else {
        // ACTION: Stop Logic
        await stopViewerBroadcast(msgs);
      }
    } catch (error) {
      console.error('[Viewer] Error:', error);
      alert(msgs.startError + error.message);
    }
  });

  async function startViewerBroadcast(msgs) {
    console.log('[Viewer] Starting viewer broadcast...');

    try {
      // Get camera directly using MediaDevices API
      localVideoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // Get video track from stream
      const videoTracks = localVideoStream.getVideoTracks();
      if (videoTracks.length === 0) throw new Error('No video track found');
      const mediaStreamTrack = videoTracks[0];

      // Get RTC Client
      let rtcClient = getRTCClient();
      if (!rtcClient || !rtcClient.client) {
        throw new Error('RTC Client not found. Please wait for room connection.');
      }

      // Create Agora video track
      localVideoTrack = AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: mediaStreamTrack
      });

      // Publish to Agora
      await rtcClient.client.publish([localVideoTrack]);

      // [LOG: 20260130_1350] Fix mobile camera freeze by playing track locally
      const container = document.getElementById("remoteVideoContainer");
      if (container) {
        let localPlayer = document.getElementById('local-user-viewer');
        if (!localPlayer) {
          localPlayer = document.createElement('div');
          localPlayer.id = 'local-user-viewer';
          localPlayer.className = 'remote-video-player local-preview';
          container.appendChild(localPlayer);
        }
        localVideoTrack.play(localPlayer, { fit: "cover", mirror: true });

        // Update grid count for CSS
        const count = container.children.length;
        container.setAttribute('data-count', count);
      }

      // Update UI
      isViewerLive = true;
      btnJoinShare.classList.add('active');
      btnJoinShare.querySelector('.material-symbols-outlined').textContent = 'stop_circle';
      btnJoinShare.querySelector('.btn-text').textContent = msgs.btnStop;
      btnJoinShare.title = msgs.titleStop;

      console.log('[Viewer] ✅ Broadcast started successfully');

    } catch (error) {
      // Clean up on error
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideoStream = null;
      }
      if (localVideoTrack) {
        localVideoTrack.close();
        localVideoTrack = null;
      }
      throw error;
    }
  }

  async function stopViewerBroadcast(msgs) {
    console.log('[Viewer] Stopping viewer broadcast...');

    try {
      // Unpublish from Agora
      const rtcClient = getRTCClient();
      if (rtcClient && localVideoTrack) {
        await rtcClient.client.unpublish([localVideoTrack]);
        localVideoTrack.stop(); // [LOG: 20260130_1350] Stop playback
        localVideoTrack.close();
        localVideoTrack = null;

        // Remove local preview
        const localPlayer = document.getElementById('local-user-viewer');
        if (localPlayer) localPlayer.remove();

        const container = document.getElementById("remoteVideoContainer");
        if (container) {
          const count = container.children.length;
          container.setAttribute('data-count', count);
        }
      }

      // Stop local media stream
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
        localVideoStream = null;
      }

      // Update UI
      isViewerLive = false;
      btnJoinShare.classList.remove('active');
      btnJoinShare.querySelector('.material-symbols-outlined').textContent = 'podcasts';
      btnJoinShare.querySelector('.btn-text').textContent = msgs.btnStart;
      btnJoinShare.title = msgs.titleStart;

      console.log('[Viewer] ⏹️ Broadcast stopped successfully');
      showNotification(msgs.stopped);

    } catch (error) {
      console.error('[Viewer] Stop broadcast error:', error);
      throw error;
    }
  }

  function getRTCClient() {
    if (window.liveManager && window.liveManager.rtcClient) return window.liveManager.rtcClient;
    if (window.rtcClient) return window.rtcClient;
    if (window.AgoraRTCClient) return window.AgoraRTCClient;
    return null;
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 12px;
      font-size: 18px;
      text-align: center;
      z-index: 99999;
      white-space: pre-line;
      animation: fadeInOut 2.5s forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2500);
  }

  // Animation Style
  if (!document.getElementById('notify-anim-style')) {
    const style = document.createElement('style');
    style.id = 'notify-anim-style';
    style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
    document.head.appendChild(style);
  }
});
