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
  history: [],
  loop: false
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
  } catch (error) {
    console.log('error while fetching', model.model)
  }
}

async function handleCompute(promptOrModel) {
  console.log(promptOrModel)
  const model = state.models.find((m) => m.model === promptOrModel)
  console.log(model)
  if (model) {
    if (model === state.models[state.models.length - 1]) {
      if (state.loop) {
        await compute(state.models[0], state.history[state.history.length - 1].response.response)
      } else {
        return log()
      }
    } else {
      const index = state.models.indexOf(model)
      await compute(state.models[index + 1], state.history[state.history.length - 1].response.response)
    }
  } else {
    if (!state.models[0]) return console.log('no model to compute')
    await compute(state.models[0], promptOrModel)
  }
}

async function compute (model, prompt) {
  sync({
    type: 'compute-start',
    payload: model.model
  })
  console.log('computing', model.model)
  const response = await generate(model, prompt)
  console.log('repsonse', response)
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

function broadcast (data, ws) {
  const msg = JSON.stringify(data)

  if (!ws) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  } else {
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  }
}

function sync (msg) {
  msg.from = 'server'
  msg.state = state

  broadcast(msg)
}

function handleModel (payload, from) {
  const model = {
    model: payload,
    from: from
  }

  const find = state.models.find(m => m.from === from)
  if (find) {
    const index = state.models.indexOf(find)
    state.models[index] = model
    console.log('edited model', model.model)
  } else {
    state.models.push(model)
    console.log('added model', model.model)
  }
}

function handleOrder (models) {
  state.models = models.map((mn) => state.models.find((m) => m.model === mn ))
}

function handleLoop () {
  state.loop = !state.loop
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress.replace('::ffff:', '')
  console.log('connection', ip)

  ws.on('message', async data => {
    const msg = JSON.parse(data)

    msg.from = ip
    msg.state = state

    if (msg.type === 'model') {
      handleModel(msg.payload, msg.from)
    }

    if (msg.type === 'compute') {
      handleCompute(msg.payload)
    }

    if (msg.type === 'loop') {
      handleLoop()
    }

    if (msg.type === 'order') {
      handleOrder(msg.payload)
    }

    if (msg.type === 'abort') {
      /* stop all computation? */
    }
    
    if (msg.type === 'speech-end') {
      handleCompute(msg.payload)
    }

    if (msg.type === 'init') {
      ws.send(JSON.stringify(msg))
    } else {
      broadcast(msg)
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
