let state = {
  server: '172.17.15.68',
  from: null,
  model: '',
  models: [],
  mode: '',
  computing: false
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
    console.log(state.model, state.computing)
  } else if (msg.type == 'compute-end') {
    if (msg.payload && msg.payload.model === state.model) {
      startSpeech(msg.payload.response)
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
    document.querySelector('header').style.background = 'green'
  } else {
    document.querySelector('header').style.background = 'red'
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

function startSpeech (text) {
  const textContainer = document.querySelector('#response-container')
  textContainer.innerHTML = ''

  const words = text.split('')
  const utterance = new SpeechSynthesisUtterance(text)

  let prevChar = 0
  utterance.addEventListener('boundary', (event) => {
    const char = event.charIndex + event.charLength
    const word = words.slice(prevChar, char).join('')
    prevChar = char

    const span = document.createElement('span')
    span.textContent = word
    span.id = `word-${event.charIndex}`
    textContainer.appendChild(span)
  })

  utterance.addEventListener('end', (event) => {
    state.computing = false
    updateUi()

    send({
      type: 'speech-end',
      payload: state.model
    })
  })

  const voices = speechSynthesis.getVoices()
  utterance.voice = voices[0]
  utterance.rate = 3

  window.speechSynthesis.speak(utterance)
}

function init () {
  loadState()
  updateUi()
}

init()
