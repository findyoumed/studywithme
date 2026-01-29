/**
 * Viewer Share Link Functionality
 * Allows viewers to copy room link to clipboard
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
    // Fallback: 폰트 API 미지원 브라우저
    setTimeout(() => {
      btnJoinShare.classList.add('ready');
    }, 100);
  }

  btnJoinShare.addEventListener('click', async () => {
    console.log('[Viewer] Share button clicked');

    try {
      // 현재 페이지 URL 복사
      const currentUrl = window.location.href;
      
      // Clipboard API 사용
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        console.log('[Viewer] ✅ Link copied:', currentUrl);
        showSuccess();
      } else {
        // Fallback: 구형 브라우저
        fallbackCopyToClipboard(currentUrl);
      }

    } catch (error) {
      console.error('[Viewer] Copy error:', error);
      alert('링크 복사 실패: ' + error.message);
    }
  });

  function showSuccess() {
    // 버튼 색상 변경 (초록색)
    btnJoinShare.classList.add('copied');
    
    // 아이콘과 텍스트 변경
    const icon = btnJoinShare.querySelector('.material-symbols-outlined');
    const text = btnJoinShare.querySelector('.btn-text');
    const originalIcon = icon.textContent;
    const originalText = text.textContent;
    
    icon.textContent = 'check_circle';
    text.textContent = 'Copied!';

    // 알림 메시지
    showNotification('✅ 링크가 복사되었습니다!\n친구들과 공유하세요 🎉');

    // 2초 후 원래대로
    setTimeout(() => {
      btnJoinShare.classList.remove('copied');
      icon.textContent = originalIcon;
      text.textContent = originalText;
    }, 2000);
  }

  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('[Viewer] ✅ Link copied (fallback)');
      showSuccess();
    } catch (err) {
      console.error('[Viewer] Fallback copy failed:', err);
      alert('링크 복사 실패. 수동으로 복사해주세요:\n' + text);
    }
    
    document.body.removeChild(textArea);
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
      text-align: center;
      white-space: pre-line;
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
