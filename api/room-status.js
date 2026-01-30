export default function handler(req, res) {
    const { channelName } = req.query;

    if (!channelName) {
        return res.status(400).json({ error: "channelName required" });
    }

    // [WARNING] On Vercel (Serverless), we cannot track real-time participants in memory.
    // We always return "Not Full" to ensure usability.
    // To fix this properly, a database (Redis) is required.

    res.json({
        channelName,
        currentParticipants: 0, // Mock data
        maxParticipants: 50,
        isFull: false,
        canJoin: true
    });
}
