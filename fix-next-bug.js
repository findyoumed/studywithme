/**
 * Quick Fix for "Next: -" Bug
 * 
 * INSTRUCTIONS:
 * 1. F12를 눌러 브라우저 콘솔 열기
 * 2. 아래 코드 전체를 복사해서 붙여넣기
 * 3. Enter 키 누르기
 * 4. 페이지가 자동으로 새로고침됩니다
 */

console.log('🔧 Clearing localStorage...');
localStorage.clear();
console.log('✅ localStorage cleared!');
console.log('🔄 Reloading page...');
location.reload();
