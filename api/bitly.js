export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }
    try {
        const bitlyRes = await fetch('https://api-ssl.bitly.com/v4/shorten', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 4e4ed3dc0766d7f94e23685703acf02abde7669e', // tu token Bitly
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ long_url: url })
        });
        const data = await bitlyRes.json();
        if (bitlyRes.ok && data.link) {
            return res.status(200).json({ link: data.link });
        } else {
            return res.status(500).json({ error: data.description || 'Bitly error' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}