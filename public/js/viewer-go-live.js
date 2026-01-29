/**
 * Viewer Go Live Functionality
 * Allows viewers to start their own broadcast WITHOUT cameraManager
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Viewer] Initializing Go Live button...');
  
  const btnGoLiveMeToo = document.getElementById('btnGoLiveMeToo');
  
  if (!btnGoLiveMeToo) {
    console.warn('[Viewer] Go Live button not found');
    return;
  }

  let isViewerLive = false;
  let localVideoStream = null;
  let localVideoTrack = null;

  btnGoLiveMeToo.addEventListener('click', async () => {
    console.log('[Viewer] Go Live button clicked, current state:', isViewerLive);

    try {
      if (!isViewerLive) {
        await startViewerBroadcast();
      } else {
        await stopViewerBroadcast();
      }
    } catch (error) {
      console.error('[Viewer] Go Live error:', error);
      alert('방송 시작/종료 중 오류가 발생했습니다: ' + error.message);
    }
  });

  async function startViewerBroadcast() {
    console.log('[Viewer] Starting viewer broadcast...');

    try {
      // Get camera directly using MediaDevices API
      console.log('[Viewer] Requesting camera access...');
      localVideoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      console.log('[Viewer] Camera access granted');

      // Get video track from stream
      const videoTracks = localVideoStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video track found');
      }

      const mediaStreamTrack = videoTracks[0];
      console.log('[Viewer] Got media stream track');

      // Check if liveManager exists
      if (!window.liveManager || !window.liveManager.rtcClient) {
        throw new Error('Live manager not initialized. Please refresh the page.');
      }

      const rtcClient = window.liveManager.rtcClient;
      console.log('[Viewer] RTC Client ready');

      // Create Agora video track from MediaStreamTrack
      console.log('[Viewer] Creating Agora video track...');
      localVideoTrack = AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: mediaStreamTrack
      });

      console.log('[Viewer] Created Agora track');

      // Publish to Agora
      console.log('[Viewer] Publishing video track...');
      await rtcClient.client.publish([localVideoTrack]);

      // Update UI
      isViewerLive = true;
      btnGoLiveMeToo.classList.add('active');
      btnGoLiveMeToo.querySelector('.material-symbols-outlined').textContent = 'stop_circle';
      btnGoLiveMeToo.querySelector('.btn-text').textContent = 'Stop Live';
      btnGoLiveMeToo.title = '방송 종료';

      console.log('[Viewer] ✅ Broadcast started successfully');
      showNotification('✅ 방송이 시작되었습니다!');

    } catch (error) {
      console.error('[Viewer] Start broadcast error:', error);
      
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

  async function stopViewerBroadcast() {
    console.log('[Viewer] Stopping viewer broadcast...');

    try {
      // Unpublish from Agora
      if (window.liveManager && window.liveManager.rtcClient && localVideoTrack) {
        const rtcClient = window.liveManager.rtcClient;
        console.log('[Viewer] Unpublishing track...');
        await rtcClient.client.unpublish([localVideoTrack]);
        
        // Close Agora track
        localVideoTrack.close();
        localVideoTrack = null;
      }

      // Stop local media stream
      if (localVideoStream) {
        console.log('[Viewer] Stopping local stream...');
        localVideoStream.getTracks().forEach(track => {
          track.stop();
          console.log('[Viewer] Stopped track:', track.kind);
        });
        localVideoStream = null;
      }

      // Update UI
      isViewerLive = false;
      btnGoLiveMeToo.classList.remove('active');
      btnGoLiveMeToo.querySelector('.material-symbols-outlined').textContent = 'podcasts';
      btnGoLiveMeToo.querySelector('.btn-text').textContent = 'Join & Go Live';
      btnGoLiveMeToo.title = '나도 방송 참여하기';

      console.log('[Viewer] ⏹️ Broadcast stopped successfully');
      showNotification('⏹️ 방송이 종료되었습니다');
      
    } catch (error) {
      console.error('[Viewer] Stop broadcast error:', error);
      throw error;
    }
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
      z-index: 99999;
      animation: fadeInOut 2s forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
  `;
  document.head.appendChild(style);
});
