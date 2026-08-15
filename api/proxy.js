// api/proxy.js
// Perantara antara frontend (Vercel) dan backend (Google Apps Script).
// Karena permintaan ini dikirim dari server Vercel ke Google (server-to-server),
// aturan CORS di browser tidak berlaku, jadi ini menghindari error "Failed to fetch".

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxPaKqBb0Hfl3XyoU2b-BNKWfU72jhXvE_-WJHJodBTioZwnRw0lgqKMV-oQcP0Y6We/exechttps://script.google.com/macros/s/AKfycbxgXp4-aq6ZrXhn4UsTqBxUmyRHsaKHnoqOQ4jsInbWcp5nUK847COwnLwBemoLoo2u/exec';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method tidak diizinkan' });
    return;
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body)
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      // Apps Script kadang balas HTML (halaman error/login) alih-alih JSON,
      // biasanya karena deployment belum di-update atau bukan "Anyone" access.
      res.status(502).json({
        ok: false,
        error: 'Respons dari Apps Script bukan JSON. Cek deployment Apps Script (Execute as: Me, Access: Anyone).'
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Gagal menghubungi Apps Script: ' + (err.message || err) });
  }
};
