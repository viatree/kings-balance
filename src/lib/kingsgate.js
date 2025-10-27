import axios from 'axios';

const { KG_BASE_URL, KG_INTEGRATION_ID, KG_API_KEY } = process.env;

function assertEnv() {
  if (!KG_BASE_URL) throw new Error('ENV KG_BASE_URL kosong');
  if (!KG_INTEGRATION_ID) throw new Error('ENV KG_INTEGRATION_ID kosong');
  if (!KG_API_KEY) throw new Error('ENV KG_API_KEY kosong');
  
}

async function tryAuth(url) {
  const body = {
    api_key: KG_API_KEY,
    integration_id: KG_INTEGRATION_ID,
  };
  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  // Dok resmi: { "status": 200, "accessToken": "..." }
  const token = res.data?.accessToken || res.data?.data?.accessToken;
  if (!token) throw new Error(`Access token tidak ditemukan. Res: ${JSON.stringify(res.data)}`);
  return token;
}

export async function getAccessToken() {
  assertEnv();
  // Dokumen ada dua varian path; coba keduanya agar robust:
  const urls = [
    `${KG_BASE_URL}/api/merchant/auth`, // sesuai “Endpoint: POST /api/merchant/auth”
    `${KG_BASE_URL}/merchant/auth`,     // sesuai contoh curl mereka yang tanpa /api
  ];
  let lastErr;
  for (const u of urls) {
    try {
      return await tryAuth(u);
    } catch (e) {
      lastErr = e;
      // kalau 404/400, lanjut coba path berikutnya
      if (!e.response || (e.response.status !== 404 && e.response.status !== 400)) break;
    }
  }
  if (lastErr?.response) {
    throw new Error(`Auth ${lastErr.response.status}: ${JSON.stringify(lastErr.response.data)}`);
  }
  throw lastErr || new Error('Auth gagal tanpa respons');
}

export async function getBalance(accessToken) {
  try {
    const url = `${KG_BASE_URL}/api/merchant/balance`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    const balance = res.data?.data?.balance;
    if (balance === undefined || balance === null) {
      throw new Error(`Balance tidak ditemukan. Res: ${JSON.stringify(res.data)}`);
    }
    return balance;
  } catch (e) {
    if (e.response) {
      throw new Error(`Balance ${e.response.status}: ${JSON.stringify(e.response.data)}`);
    }
    throw e;
  }
}
export async function createPayout(accessToken, payload) {
  // Kirim ke Kingsgate: POST /api/payout  (Authorization: Bearer <token>)
  const url = `${KG_BASE_URL}/api/payout`;
  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    return res.data; // { status: 201, data: {...} }
  } catch (e) {
    if (e.response) {
      throw new Error(`Payout ${e.response.status}: ${JSON.stringify(e.response.data)}`);
    }
    throw e;
  }
}

export async function getPayoutStatus(accessToken, orderId) {
  // Dokumen: GET /api/payout/order-status/:orderId
  const url = `${KG_BASE_URL}/api/payout/order-status/${encodeURIComponent(orderId)}`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    return res.data; // { httpStatus: 200, data: {...} }
  } catch (e) {
    if (e.response) {
      throw new Error(`PayoutStatus ${e.response.status}: ${JSON.stringify(e.response.data)}`);
    }
    throw e;
  }
}