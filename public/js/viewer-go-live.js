/**
 * Viewer Go Live Functionality
 * Allows viewers to start their own broadcast
 */

// Wait for DOM and live-manager to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Viewer] Initializing Go Live button...');
  
  const btnGoLiveMeToo = document.getElementById('btnGoLiveMeToo');
  
  if (!btnGoLiveMeToo) {
    console.warn('[Viewer] Go Live button not found');
    return;
  }

  let isViewerLive = false;

  btnGoLiveMeToo.addEventListener('click', async () => {
    console.log('[Viewer] Go Live button clicked, current state:', isViewerLive);

    try {
      if (!isViewerLive) {
        // Start viewer's own broadcast
        await startViewerBroadcast();
      } else {
        // Stop viewer's broadcast
        await stopViewerBroadcast();
      }
    } catch (error) {
      console.error('[Viewer] Go Live error:', error);
      alert('방송 시작/종료 중 오류가 발생했습니다: ' + error.message);
    }
  });

  async function startViewerBroadcast() {
    console.log('[Viewer] Starting viewer broadcast...');

    // Check if cameraManager exists
    if (!window.cameraManager) {
      alert('카메라를 먼저 켜주세요!');
      return;
    }

    // Check camera state
    const cameraState = window.cameraManager.getState();
    console.log('[Viewer] Camera state:', cameraState);

    if (!cameraState || !cameraState.streaming) {
      alert('카메라가 켜져있지 않습니다. 카메라를 먼저 켜주세요.');
      return;
    }

    // Get video track
    let videoTrack = window.cameraManager.getVideoTrack();
    console.log('[Viewer] Video track:', videoTrack);

    if (!videoTrack) {
      alert('비디오 트랙을 가져올 수 없습니다.');
      return;
    }

    // Check if rtcClient exists (from live-manager)
    if (!window.liveManager || !window.liveManager.rtcClient) {
      alert('라이브 시스템이 초기화되지 않았습니다.');
      return;
    }

    // Publish video
    const rtcClient = window.liveManager.rtcClient;
    await rtcClient.publish(videoTrack);

    // Update UI
    isViewerLive = true;
    btnGoLiveMeToo.classList.add('active');
    btnGoLiveMeToo.querySelector('.material-symbols-outlined').textContent = 'stop_circle';
    btnGoLiveMeToo.querySelector('.btn-text').textContent = 'Stop Live';
    btnGoLiveMeToo.title = '방송 종료';

    console.log('[Viewer] Broadcast started successfully');
    showNotification('✅ 방송이 시작되었습니다!');
  }

  async function stopViewerBroadcast() {
    console.log('[Viewer] Stopping viewer broadcast...');

    if (!window.liveManager || !window.liveManager.rtcClient) {
      return;
    }

    const rtcClient = window.liveManager.rtcClient;
    
    // Unpublish
    if (rtcClient.localTracks && rtcClient.localTracks.videoTrack) {
      await rtcClient.client.unpublish([rtcClient.localTracks.videoTrack]);
      rtcClient.localTracks.videoTrack.close();
      rtcClient.localTracks.videoTrack = null;
    }

    // Update UI
    isViewerLive = false;
    btnGoLiveMeToo.classList.remove('active');
    btnGoLiveMeToo.querySelector('.material-symbols-outlined').textContent = 'podcasts';
    btnGoLiveMeToo.querySelector('.btn-text').textContent = 'Join & Go Live';
    btnGoLiveMeToo.title = '나도 방송 참여하기';

    console.log('[Viewer] Broadcast stopped');
    showNotification('⏹️ 방송이 종료되었습니다');
  }

  function showNotification(message) {
    // Simple notification
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
