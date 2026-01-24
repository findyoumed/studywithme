export default function handler(req, res) {
    // Return the YouTube API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (apiKey) {
        res.status(200).json({ apiKey });
    } else {
        res.status(404).json({ error: 'API key not found' });
    }
}
