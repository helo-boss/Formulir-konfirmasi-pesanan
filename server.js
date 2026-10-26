const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const port = Number(process.env.PORT || 3000)
const filePath = path.join(__dirname, 'index.html')

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(payload))
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  if (body.length > 100_000) throw new Error('Payload terlalu besar')
  return JSON.parse(body || '{}')
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/telegram') {
    try {
      const data = await readJson(req)
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (!token || !chatId) return sendJson(res, 500, { error: 'Konfigurasi Telegram belum tersedia.' })

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
        const description = telegramResult.description || 'Telegram menolak pesan'
        throw new Error(description)
      }
      return sendJson(res, 200, { ok: true })
    } catch (error) {
      console.error('Telegram send failed:', error.message)
      return sendJson(res, 400, { error: error.message || 'Pesan Telegram gagal dikirim.' })
    }
  }

  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Unable to load page')
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(content)
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Static server listening on port ${port}`)
})
