/**
 * Development Utility: Reset Playlist
 * 
 * This script helps fix the "Next: -" issue by clearing and reloading the playlist from playlist.txt
 * 
 * HOW TO USE:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Refresh the page (Ctrl + R)
 */

(function () {
    console.log('🔧 Resetting playlist from localStorage...');

    // Clear the existing playlist
    localStorage.removeItem('playlist');

    console.log('✅ Playlist cleared from localStorage');
    console.log('📝 Please refresh the page (Ctrl + R) to reload from playlist.txt');
    console.log('');
    console.log('If the problem persists, run this command:');
    console.log('localStorage.clear()');
})();
