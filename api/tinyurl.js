export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });
    try {
        const tinyRes = await fetch('https://api.tinyurl.com/create', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TINYURL_TOKEN}`
            },
            body: JSON.stringify({
                url,
                domain: 'tinyurl.com'
            })
        });
        const data = await tinyRes.json();
        if (tinyRes.ok && data.data?.tiny_url) {
            return res.status(200).json({ link: data.data.tiny_url });
        } else {
            return res.status(500).json({ error: data.errors?.[0]?.message || 'TinyURL error' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}