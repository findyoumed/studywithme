/**
 * API Client
 * Handles communication with the backend server for Agora tokens and room management.
 */

export const ApiClient = {
    async fetchTokens(channelName, uid, role) {
        const endpoint = `/api/get-agora-token?channelName=${channelName}&uid=${uid}&role=${role}`;
        try {
            const response = await fetch(endpoint);
            
            // 🔒 Handle Full Room
            if (!response.ok) {
                const errorData = await response.json();
                
                if (errorData.error === 'ROOM_FULL') {
                    console.error(`⛔ Room full: ${errorData.message}`);
                    alert(`❌ ${errorData.message}\n\nPlease try another room.`);
                    throw new Error('ROOM_FULL');
                }
                
                throw new Error(`Token fetch failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch Agora token:", error);
            throw error;
        }
    },

    async notifyParticipantLeft(channelName, uid) {
        try {
            await fetch('/api/participant-left', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName, uid }),
                keepalive: true
            });
        } catch (error) {
            console.error('Failed to notify participant left:', error);
        }
    }
};
