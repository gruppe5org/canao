const path = require('path')
const express = require('express')
const WebSocket = require('ws')
const fetch = require('node-fetch')

const app = express()

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/controller', express.static(path.join(__dirname, 'controller')))

app.listen(2124, () => console.log(`http://localhost:2124`))

const wss = new WebSocket.Server({ port: 2125 })

const state = {
  models: [],
  history: []
}

async function generate (model, prompt) {
  const response = await fetch(`http://${model.from}:11434/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
      model: model.model,
      prompt,
      stream: false
    })
  })
  console.log(response)
  return await response.json()
}

async function compute (initialPrompt) {
  for (const model of state.models) {
    sync({
      type: 'compute-start',
      payload: model.model
    })
    const prompt =
      state.history.length === 0
        ? initialPrompt
        : state.history[state.history.length - 1].response.response
    const response = await generate(model, prompt)
    state.history.push({
      model,
      prompt,
      response,
      timestamp: Date.now()
    })
    sync({
      type: 'compute-end',
      payload: response
    })
    console.log(response)
  }
}

function broadcast (data, ws) {
  if (!ws) {
    wss.clients.forEach(client => {
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

function sync (msg) {
  msg.from = 'server'
  msg.state = state

  broadcast(JSON.stringify(msg))
}

function handleModel (msg) {
  const model = {
    model: msg.payload,
    from: msg.from
  }

  const find = state.models.find(m => m.from === msg.from)
  if (find) {
    const index = state.models.indexOf(find)
    state.models[index] = model
  } else {
    state.models.push(model)
  }
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress.replace('::ffff:', '')
  console.log('new', ip)

  ws.on('message', async data => {
    const msg = JSON.parse(data)

    msg.from = ip
    msg.state = state

    if (msg.type === 'model') {
      handleModel(msg)
    }

    if (msg.type === 'compute') {
      compute(msg.payload)
    }

    if (msg.type === 'init') {
      ws.send(JSON.stringify(msg))
    } else {
      broadcast(JSON.stringify(msg), ws)
    }
  })

  ws.on('close', () => {
    state.models = state.models.filter(m => m.from !== ip)
    sync({
      type: 'disconnect'
    })
  })
})
