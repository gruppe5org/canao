let state = {
  server: '172.17.13.105',
  from: null,
  model: '',
  models: [],
  mode: '',
  response: 'false'
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

  if (msg.type === 'compute-start') {
    state.computing = msg.payload === state.model
  } else if (msg.type === 'compute-end') {
    if (msg.payload.model === state.model) {
      state.computing = false
      speak(msg.payload.response)
      console.log(msg.payload.response)
    }
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
  document.querySelector('#model').value = state.model
  if (state.computing) {
    document.querySelector('header').style.backgroundColor = 'green'
  } else {
    document.querySelector('header').style.backgroundColor = 'red'
  }
}

function loadState () {
  if (!localStorage.getItem('state')) return
  else state = JSON.parse(localStorage.getItem('state'))
}

function saveState () {
  localStorage.setItem('state', JSON.stringify(state))
}

function send (msg) {
  socket.send(JSON.stringify(msg))
}

function speak (text) {
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = speechSynthesis.getVoices()
  utterance.voice = voices[0]
  speechSynthesis.speak(utterance)
}

function init () {
  loadState()
  updateUi()
}

init()
