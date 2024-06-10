let state = {
  server: '172.17.15.68',
  from: null,
  model: '',
  models: [],
  loop: false,
  computing: '',
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

document
  .querySelector('#prompt')
  .addEventListener('keydown', (event) => {
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

  if (msg.type === 'model') {
    console.log(state.models)
  }

  if (msg.type === 'compute-start') {
    state.computing = msg.payload
  }

  if (msg.type === 'compute-end') {
    state.computing = msg.payload.model
  }
  
  if (msg.type === 'speech-end') {
    if (msg.payload === state.computing) state.computing = ''
  }

  state.models = msg.state.models
  state.loop = msg.state.loop
  updateUi()
})

function compute () {
  const initialPrompt = document.querySelector('#prompt').value
  if (!initialPrompt) {
    return console.log('no initial prompt')
  } else {
    send({
      type: 'compute',
      payload: initialPrompt
    })
  }
}

function updateUi () {
  if (!state.computing){
    document.querySelector('body').style.setProperty('--primary-color', 'blue')
    document.querySelector('#compute').textContent = 'compute'
  } else {
    document.querySelector('body').style.setProperty('--primary-color', 'red')
    document.querySelector('#compute').textContent = 'computing'
  }

  document.querySelector('#from').textContent = state.from
  document.querySelector('#clients').textContent = state.models.length
  document.querySelector('#loop').textContent = `loop (${state.loop ? 'on': 'off'})`


  const list = document.querySelector('#models')
  list.innerHTML = ''

  state.models.forEach(item => {
    const newItem = document.createElement('li')
    newItem.id = item.model
    newItem.innerHTML = item.model
    list.appendChild(newItem)
  })

  if (state.computing !== '') {
    console.log('highlight', state.computing)
    document.querySelector(`#${state.computing}`).classList.add('highlight')
  } 
}

function send (msg) {
  console.log('send', msg)
  socket.send(JSON.stringify(msg))
}
