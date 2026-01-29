export default async function handler(req, res) {
    const { q } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY; // Vercel Env Var

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=30&q=${encodeURIComponent(q)}&key=${apiKey}`; // Ensuring 30 results

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error?.message || 'YouTube API Error' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
