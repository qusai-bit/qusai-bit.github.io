export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, vQuality = '1080', isAudioOnly = false } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const instances = [
    'https://cobalt.api.timelessnesses.me',
    'https://co.wuk.sh',
    'https://cobalt.drgns.space',
    'https://cobalt.floofy.dev',
  ];

  const audioOnly = isAudioOnly === true || isAudioOnly === 'true';
  const quality = vQuality === 'max' ? '1080' : String(vQuality);

  for (const instance of instances) {
    try {
      // Try v10 format first
      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          url,
          videoQuality: quality,
          audioFormat: 'mp3',
          downloadMode: audioOnly ? 'audio' : 'auto',
          filenameStyle: 'pretty'
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        // Try v7 format as fallback
        const response7 = await fetch(`${instance}/api/json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            url,
            vCodec: 'h264',
            vQuality: quality,
            aFormat: 'mp3',
            isAudioOnly: audioOnly
          }),
          signal: AbortSignal.timeout(8000)
        });
        if (!response7.ok) continue;
        const data7 = await response7.json();
        if (data7.status === 'error') continue;
        return res.status(200).json(data7);
      }

      const data = await response.json();
      console.log('Instance:', instance, 'Response:', JSON.stringify(data));
      if (data.status === 'error' && data.error?.code === 'error.api.auth.jwt.missing') continue;
      return res.status(200).json(data);
    } catch (err) {
      console.log('Instance failed:', instance, err.message);
      continue;
    }
  }

  return res.status(500).json({ error: 'All download instances are currently unavailable. Try again later.' });
}
