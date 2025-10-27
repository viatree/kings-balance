import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const checkBalance = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await axios.get('/api/balance');
      setBalance(res.data?.balance);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Kingsgate Merchant Balance</h1>
      <button onClick={checkBalance} disabled={loading}>
        {loading ? 'Checking...' : 'Check Balance'}
      </button>
      {balance !== null && <p>Saldo: <strong>{balance}</strong></p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
      <p style={{ marginTop: 20, opacity: 0.7 }}>
        Jalankan bot lewat <code>/api/health</code> untuk memulai polling Telegram.
      </p>
    </main>
  );
}
