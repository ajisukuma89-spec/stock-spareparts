// api/proxy.js
// Perantara antara frontend (Vercel) dan backend (Google Apps Script).
// Karena permintaan ini dikirim dari server Vercel ke Google (server-to-server),
// aturan CORS di browser tidak berlaku, jadi ini menghindari error "Failed to fetch".

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcLvaZEcKgCqQllUi14U48MYEaoHclaGwYAgJH6UvB_ZI5WXjiMS1alKOp9DrdChG3/exec';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function callAppsScript(body) {
  const upstream = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const text = await upstream.text();
  return JSON.parse(text); // sengaja dibiarkan throw kalau bukan JSON, ditangkap di pemanggil
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method tidak diizinkan' });
    return;
  }

  // Coba sampai 3x. Kegagalan non-JSON dari Apps Script sering bersifat SEMENTARA
  // (rate-limit/quota Google), jadi retry singkat biasanya langsung berhasil.
  const maxAttempts = 3;
  let lastErrorSnippet = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await callAppsScript(req.body);
      res.status(200).json(data);
      return;
    } catch (err) {
      lastErrorSnippet = String(err.message || err).slice(0, 200);
      if (attempt < maxAttempts) {
        await sleep(attempt * 700); // tunggu makin lama tiap percobaan (700ms, lalu 1400ms)
        continue;
      }
    }
  }

  res.status(502).json({
    ok: false,
    error: 'Apps Script tidak merespons dengan JSON setelah ' + maxAttempts + 'x percobaan. ' +
           'Biasanya ini rate-limit/quota sementara dari Google — coba lagi dalam 1-2 menit. ' +
           'Kalau terus terjadi, cek deployment Apps Script (Execute as: Me, Access: Anyone). ' +
           '[detail: ' + lastErrorSnippet + ']'
  });
};
