export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, vQuality = '1080', isAudioOnly = false } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  // List of public Cobalt instances to try in order
  const instances = [
    'https://cobalt.api.timelessnesses.me',
    'https://co.wuk.sh',
    'https://cobalt.drgns.space',
    'https://cobalt.floofy.dev',
  ];

  const body = JSON.stringify({
    url,
    videoQuality: vQuality === 'max' ? '1080' : String(vQuality),
    audioFormat: 'mp3',
    downloadMode: (isAudioOnly === true || isAudioOnly === 'true') ? 'audio' : 'auto',
    filenameStyle: 'pretty'
  });

  for (const instance of instances) {
    try {
      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body,
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (data.status === 'error' && data.error?.code === 'error.api.auth.jwt.missing') continue;
      return res.status(200).json(data);
    } catch (err) {
      continue;
    }
  }

  return res.status(500).json({ error: 'All download instances are currently unavailable. Try again later.' });
}
