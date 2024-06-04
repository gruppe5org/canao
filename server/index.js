const path = require('path')
const express = require('express')
const WebSocket = require('ws')

const app = express()

app.use('/', express.static(path.join(__dirname, 'client')))

app.listen(2124, () => console.log(`http://localhost:2124`))

const wss = new WebSocket.Server({ port: 2125 })

const state = {
  models: []
}

function broadcast (ws, data, all) {
  if (all) {
    wss.clients.forEach(client => {
      console.log('client', client._socket.remoteAddress)
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  } else {
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }
}

wss.on('connection', (ws, req) => {
  console.log('new', req.socket.remoteAddress)
  ws.on('message', async data => {
    const msg = JSON.parse(data)

    msg.viewers = wss.clients.size
    msg.from = req.socket.remoteAddress.replace('::ffff:', '')

    if (msg.type === 'model') {
      state.models.push({
        model: msg.payload,
        ip: msg.from
      })
      console.log(state.models)
    }

    if (msg.type === 'init') {
      ws.send(JSON.stringify(msg))
    } else {
      broadcast(ws, JSON.stringify(msg), true)
    }
  })
})
