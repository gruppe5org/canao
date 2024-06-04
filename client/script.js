let state = {
  server: 'localhost',
  ip: null,
  model: ''
}

const socket = new WebSocket(`ws://${state.server}:2125`)

socket.addEventListener('open', () => {
  send({
    type: 'init'
  })
})

socket.addEventListener('message', message => {
  const msg = JSON.parse(message.data)
  state.viewers = msg.viewers

  if (msg.type === 'init') {
    state.ip = msg.from
  }

  if (msg.from === state.ip) {
    console.log('own ip', msg.from)
  }

  if (msg.type === 'compute') {
    console.log('compute')
  }

  updateUi()
})

function updateUi () {
  document.querySelector('#viewers').textContent = state.viewers
  document.querySelector('#ip').textContent = state.ip
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

document.querySelector('#send').addEventListener('click', () => {
  send({
    type: 'model',
    payload: state.model
  })

  saveState()
})
