export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, vQuality = '1080', isAudioOnly = false } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        url,
        videoQuality: vQuality === 'max' ? '1080' : String(vQuality),
        audioFormat: 'mp3',
        downloadMode: (isAudioOnly === true || isAudioOnly === 'true') ? 'audio' : 'auto',
        filenameStyle: 'pretty'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to contact download service', detail: err.message });
  }
}
