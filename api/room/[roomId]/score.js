// [WARNING] This is Volatile Memory!
// Vercel Serverless Functions reset state frequently.
// The score will be lost when the lambda instance restarts (serverless cold start).
// For production, use Redis (Upstash) or a Database.

// Simple in-memory cache for "warm" execution context
const scoreCache = new Map();

export default function handler(req, res) {
    const { roomId } = req.query; // Vercel extracts [roomId] path param to query

    if (req.method === 'POST') {
        const { score } = req.body;
        if (typeof score !== 'number') {
            return res.status(400).json({ error: 'Invalid score' });
        }
        scoreCache.set(roomId, score);
        return res.json({ success: true, cached: true });
    }

    if (req.method === 'GET') {
        const score = scoreCache.get(roomId) || 0;
        return res.json({ score });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
