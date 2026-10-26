const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const port = Number(process.env.PORT || 3000)
const filePath = path.join(__dirname, 'index.html')

const server = http.createServer((req, res) => {
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
