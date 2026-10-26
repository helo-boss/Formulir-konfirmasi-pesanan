module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan.' })
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const rawToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || ''
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || ''
    const token = rawToken.replace(/^bot/i, '')

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Konfigurasi Telegram belum tersedia.' })
    }
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
      return res.status(500).json({ error: 'Format TELEGRAM_BOT_TOKEN tidak valid.' })
    }

    const fields = [
      ['Nama', data.nama],
      ['Nomor Pesanan', data.nomor_pesanan],
      ['Status Pesanan', data.cod_status],
      ['Kurir', data.selected_kurir],
      ['Metode Pembayaran', data.metode_pembayaran],
      ['Link Virtual Account', data.ewallet_link],
      ['COD Cek Dulu', data.cod_consent ? 'Disetujui' : 'Tidak disetujui'],
      ['Catatan', data.catatan],
      ['Email', data.customer_email],
      ['File Bukti Transfer', data.bukti_tf_nama],
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')

    const text = ['Konfirmasi Pesanan Baru', '', ...fields.map(([label, value]) => `${label}: ${String(value).trim()}`)].join('\n')
    const telegramResponse = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    const telegramResult = await telegramResponse.json().catch(() => ({}))

    if (!telegramResponse.ok || !telegramResult.ok) {
      return res.status(502).json({ error: telegramResult.description || 'Telegram menolak pesan.' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Pesan Telegram gagal dikirim.' })
  }
}
