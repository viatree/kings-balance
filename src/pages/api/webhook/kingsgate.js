import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { signature } = req.body;
    if (!signature) return res.status(400).json({ error: 'signature tidak ada' });
    
    const payload = jwt.verify(signature, process.env.MERCHANT_API_KEY);
    console.log('Webhook verified:', payload);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Invalid signature' });
  }
}
