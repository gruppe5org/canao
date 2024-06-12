let state = {
  server: '10.1.105.107' /* '172.17.15.68' */,
  from: null,
  model: null,
  computing: null,
  loop: false,
  models: []
}

const socket = new WebSocket(`ws://${state.server}:2125`)

document.querySelector('#compute').addEventListener('click', () => {
  if (state.computing) {
    send({
      type: 'abort'
    })
  } else {
    compute()
  }
})

document.querySelector('#loop').addEventListener('click', () => {
  send({
    type: 'loop'
  })
  state.loop = !state.loop
  updateUi()
})

document.querySelector('#prompt').addEventListener('keydown', event => {
  if (event.key == 'Enter') {
    event.preventDefault()
    compute()
  }
})

socket.addEventListener('open', () => {
  send({
    type: 'init'
  })
})

socket.addEventListener('message', message => {
  const msg = JSON.parse(message.data)
  console.log(msg)

  if (msg.type === 'init') {
    state.from = msg.from
  }

  if (msg.type === 'compute-start') {
    state.computing = msg.payload
  }

  if (msg.type === 'compute-end') {
    if (msg.payload) {
      state.computing = msg.payload.model
    } else {
      state.computing = null
    }
  }

  if (msg.type === 'speech-end') {
    if (msg.payload === state.computing) {
      state.computing = null
    }
  }

  state.models = msg.state.models
  state.loop = msg.state.loop
  updateUi()
})

function compute () {
  const prompt = document.querySelector('#prompt').value
  if (!prompt) {
    return console.log('no initial prompt')
  } else {
    send({
      type: 'compute',
      payload: prompt
    })
  }
}

function updateUi () {
  if (!state.computing) {
    document.querySelector('body').classList.remove('computing')
    document.querySelector('#compute').textContent = 'compute'
  } else {
    document.querySelector('body').classList.add('computing')
    document.querySelector('#compute').textContent = 'computing'
  }

  document.querySelector('#from').textContent = state.from
  document.querySelector('#clients').textContent = state.models.length
  document.querySelector('#loop').textContent = `loop (${
    state.loop ? 'on' : 'off'
  })`

  const list = document.querySelector('#models')
  list.innerHTML = ''

  state.models.forEach(m => {
    const li = document.createElement('li')
    li.id = m.model
    li.classList = 'model'
    li.draggable = true
    li.innerHTML = m.model

    li.addEventListener('dragstart', function (e) {
      if (state.computing) return
      dragged = this
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', this.innerHTML)
    })

    li.addEventListener('dragover', function (e) {
      if (state.computing) return
      e.preventDefault()
      return false
    })

    li.addEventListener('drop', function (e) {
      if (state.computing) return
      e.stopPropagation()
      if (dragged !== this) {
        dragged.innerHTML = this.innerHTML
        dragged.id = this.id
        const model = e.dataTransfer.getData('text/html')
        this.innerHTML = model
        this.id = model

        const models = [...document.querySelectorAll('.model')].map(
          m => m.innerHTML
        )
        send({
          type: 'order',
          payload: models
        })
      }
      return false
    })

    list.appendChild(li)
  })

  if (state.computing) {
    document.querySelector(`#${state.computing}`).classList.add('highlight')
  }
}

function send (msg) {
  socket.send(JSON.stringify(msg))
}
