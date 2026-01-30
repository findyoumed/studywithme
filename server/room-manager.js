
export class RoomManager {
    constructor(maxParticipants = 50) {
        this.roomParticipants = new Map(); // { channelName: Set([uid]) }
        this.MAX_PARTICIPANTS_PER_ROOM = maxParticipants;
    }

    getCount(channelName) {
        const participants = this.roomParticipants.get(channelName);
        return participants ? participants.size : 0;
    }

    addParticipant(channelName, uid) {
        if (!this.roomParticipants.has(channelName)) {
            this.roomParticipants.set(channelName, new Set());
        }
        this.roomParticipants.get(channelName).add(uid);
        console.log(`✅ [${channelName}] Added UID ${uid}. Total: ${this.getCount(channelName)}`);
    }

    removeParticipant(channelName, uid) {
        const participants = this.roomParticipants.get(channelName);
        if (participants) {
            participants.delete(uid);
            console.log(`❌ [${channelName}] Removed UID ${uid}. Total: ${participants.size}`);

            if (participants.size === 0) {
                this.roomParticipants.delete(channelName);
                console.log(`🗑️ [${channelName}] Room deleted (empty)`);
            }
        }
    }

    isFull(channelName) {
        return this.getCount(channelName) >= this.MAX_PARTICIPANTS_PER_ROOM;
    }

    isUserInRoom(channelName, uid) {
        const participants = this.roomParticipants.get(channelName);
        return participants && participants.has(uid);
    }
}
