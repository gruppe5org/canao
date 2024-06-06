const path = require('path')
const fs = require('fs')
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

function log () {
  console.log('creating log...')
  fs.writeFileSync(`${path.join(__dirname, 'logs')}/${Date.now()}.json`, JSON.stringify(state.history, null, 2))
  state.history = []
}

async function generate (model, prompt) {
  try {
    const response = await fetch(`http://${model.from}:11434/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: model.model,
        prompt,
        stream: false
      })
    })
    const json = await response.json()

    if (json.error) {
      throw Error('no model')
    } else {
      return json
    }
    console.log('wtf', json)
    return json
  } catch (error) {
    console.log('error while fetching', model.model)
  }
}

async function compute (initialPrompt) {
  for (const model of state.models) {
    sync({
      type: 'compute-start',
      payload: model.model
    })
    console.log('computing', model.model)
    const prompt =
      state.history.length === 0
        ? initialPrompt
        : state.history[state.history.length - 1].response.response
    const response = await generate(model, prompt)
    if (response) {
      state.history.push({
        model,
        prompt,
        response,
        timestamp: Date.now()
      })
    }
    sync({
      type: 'compute-end',
      payload: response
    })
  }
  log()
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
    console.log('edited model', model.model)
  } else {
    state.models.push(model)
    console.log('added model', model.model)
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
    const find = state.models.find(m => m.from === ip)
    if (find) {
      const index = state.models.indexOf(find)
      state.models.splice(index, 1)
      console.log('deleted model', find.model)
    }
    state.models = state.models.filter(m => m.from !== ip)
    sync({
      type: 'disconnect'
    })
  })
})
