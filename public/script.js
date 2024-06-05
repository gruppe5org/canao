let state = {
  server: '172.17.13.105',
  from: null,
  model: '',
  models: [],
  mode: ''
}

const socket = new WebSocket(`ws://${state.server}:2125`)

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

  state.models = msg.state.models
  state.mode = msg.state.mode
  updateUi()
})

document.querySelector('#send').addEventListener('click', () => {
  state.model = document.querySelector('#model').value
  if (!state.model) return console.log('no model name')
  send({
    type: 'model',
    payload: state.model
  })
  saveState()
})

function updateUi () {
  document.querySelector('#clients').textContent = state.models.length
  document.querySelector('#from').textContent = state.from
}

function loadState () {
  if (!localStorage.getItem('state')) return
  state = JSON.parse(localStorage.getItem('state'))
}

function saveState () {
  localStorage.setItem('state', JSON.stringify(state))
}

function send (msg) {
  socket.send(JSON.stringify(msg))
}

function init () {
  loadState()
}

init()
