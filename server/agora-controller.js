
import pkg from "agora-token";
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;

export const createAgoraToken = (req, res, roomManager) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channelName;
  const uid = Number(req.query.uid);
  const role = req.query.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expireTime = 3600; 
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  if (isNaN(uid) || uid === 0) return res.status(400).json({ error: "uid must be a non-zero number" });
  if (!appId || !appCertificate) return res.status(500).json({ error: "Agora credentials not configured" });
  if (!channelName) return res.status(400).json({ error: "channelName is required" });

  const currentCount = roomManager.getCount(channelName);
  const isAlreadyInRoom = roomManager.isUserInRoom(channelName, uid);
  
  if (isAlreadyInRoom) {
    console.log(`♻️ [${channelName}] UID ${uid} reconnecting (already in room)`);
  } else if (roomManager.isFull(channelName)) {
    console.log(`⛔ [${channelName}] Room full! Rejected UID ${uid}`);
    return res.status(403).json({ 
      error: "ROOM_FULL",
      message: `방이 가득 찼습니다! (${currentCount}/${roomManager.MAX_PARTICIPANTS_PER_ROOM}명)`,
      currentParticipants: currentCount,
      maxParticipants: roomManager.MAX_PARTICIPANTS_PER_ROOM
    });
  }

  console.log(`Generating token for UID: ${uid}, Channel: ${channelName}`);
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpireTime, privilegeExpireTime);
  const rtmToken = RtmTokenBuilder.buildToken(appId, appCertificate, uid.toString(), privilegeExpireTime);

  if (!isAlreadyInRoom) roomManager.addParticipant(channelName, uid);

  res.json({ rtcToken, rtmToken });
};
