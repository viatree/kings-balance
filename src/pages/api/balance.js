import { getAccessToken, getBalance } from '@/lib/kingsgate';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).end();
    const token = await getAccessToken();
    const balance = await getBalance(token);
    res.status(200).json({ balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
