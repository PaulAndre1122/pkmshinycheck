export default async function handler(req, res) {
    const { url } = req.query;
    console.log('BITLY_TOKEN:', process.env.BITLY_TOKEN ? 'OK' : 'MISSING');
    console.log('URL to shorten:', url);

    if (!url) return res.status(400).json({ error: 'Missing url parameter' });
    try {
        const bitlyRes = await fetch('https://api-ssl.bitly.com/v4/shorten', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.BITLY_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ long_url: url })
        });
        const data = await bitlyRes.json();
        console.log('Bitly response:', data);

        if (bitlyRes.ok && data.link) {
            return res.status(200).json({ link: data.link });
        } else {
            return res.status(500).json({ error: data.description || 'Bitly error', details: data });
        }
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}