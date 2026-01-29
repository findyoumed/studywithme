import pkg from "agora-token";
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;

export default function handler(req, res) {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = req.query.channelName;
    const uid = Number(req.query.uid);
    const role = req.query.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expireTime = 3600; 
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    if (!appId || !appCertificate) {
        return res.status(500).json({ error: "Agora credentials not configured on server" });
    }

    if (!channelName) {
        return res.status(400).json({ error: "channelName is required" });
    }

    if (isNaN(uid) || uid === 0) {
        return res.status(400).json({ error: "uid must be a non-zero number" });
    }

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpireTime,
        privilegeExpireTime
    );

    const rtmToken = RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        uid.toString(),
        privilegeExpireTime
    );

    res.status(200).json({ rtcToken, rtmToken });
}
