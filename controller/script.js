let state = {
  server: '172.17.15.68',
  from: null,
  model: '',
  models: [],
  mode: '',
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

document
  .getElementById('initial-prompt')
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

  if (msg.type === 'model') {
    console.log(state.models)
  }

  if (msg.type === 'compute-start') {
    state.computing = msg.payload
  } else if (msg.type === 'speech-end') {
    if (msg.payload === state.computing) state.computing = ''
  }

  state.models = msg.state.models
  updateUi()
})

function compute () {
  const initialPrompt = document.querySelector('#initial-prompt').value
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
  if (state.computing === ''){
    document.querySelector('header').style.backgroundColor = 'red'
    document.querySelector('#compute').textContent = 'compute'
  } else {
    document.querySelector('header').style.backgroundColor = 'green'
    document.querySelector('#compute').textContent = 'abort'
  }

  document.querySelector('#clients').textContent = state.models.length


  const list = document.querySelector('#list')
  list.innerHTML = ''

  state.models.forEach(item => {
    const newItem = document.createElement('div')
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
