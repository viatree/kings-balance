import { getAccessToken, createPayout } from '@/lib/kingsgate';

// Helper validasi sederhana
function assertBase(body) {
  const { amount, paymentMethod, user } = body || {};
  if (typeof amount !== 'number') throw new Error('amount harus number');
  if (!['UPI', 'NET_BANKING', 'E_WALLET'].includes(paymentMethod))
    throw new Error('paymentMethod harus salah satu dari: UPI, NET_BANKING, E_WALLET');
  if (!user || !user.id || !user.name) throw new Error('user.id dan user.name wajib');
}

function assertPerMethod(body) {
  if (body.paymentMethod === 'UPI') {
    const d = body.upiDetails || {};
    if (!d.upiId || !d.mobileNumber) throw new Error('upiDetails.upiId & upiDetails.mobileNumber wajib untuk UPI');
  }
  if (body.paymentMethod === 'NET_BANKING') {
    const d = body.netBankingDetails || {};
    if (!d.beneficiaryName || !d.bankName || !d.accountNumber || !d.ifscCode)
      throw new Error('netBankingDetails.* wajib lengkap untuk NET_BANKING');
  }
  if (body.paymentMethod === 'E_WALLET') {
    const d = body.eWalletDetails || {};
    if (!d.appName || !d.mobileNumber) throw new Error('eWalletDetails.appName & eWalletDetails.mobileNumber wajib untuk E_WALLET');
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const body = req.body;
    assertBase(body);
    assertPerMethod(body);

    const token = await getAccessToken();
    const result = await createPayout(token, body);

    // Kingsgate umumnya balas { status: 201, data: {...} }
    res.status(result?.status || 200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Bad Request' });
  }
}
