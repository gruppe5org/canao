let state = {
  server: '172.17.15.68',
  from: null,
  model: '',
  models: [],
  mode: '',
  computing: ''
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
    if (msg.payload === state.model) {
      state.computing = state.model
    } else {
      state.computing = msg.payload
    }
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
  state.model = document.querySelector('#model').value.toLowerCase()
  if (!state.model) return console.log('no model name')
  send({
    type: 'model',
    payload: state.model
  })
  saveState()
})

function updateUi () {
  document.querySelector('#from').textContent = state.from
  document.querySelector('#model').value = state.model

  if (state.computing !== state.model) {
    document.querySelector('body').style.setProperty('--primary-color', 'blue')
  } else {
    document.querySelector('body').style.setProperty('--primary-color', 'red')
  }
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

function loadState () {
  if (localStorage.getItem('state')) {
    state = JSON.parse(localStorage.getItem('state'))
  }
}

function saveState () {
  localStorage.setItem('state', JSON.stringify(state))
}

function send (msg) {
  socket.send(JSON.stringify(msg))
}

function startSpeech (text) {
  const textContainer = document.querySelector('#response')
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

    textContainer.scrollTop = textContainer.scrollHeight
  })

  utterance.addEventListener('end', (event) => {
    state.computing = ''
    updateUi()

    send({
      type: 'speech-end',
      payload: state.model
    })
  })

  const voices = speechSynthesis.getVoices()
  utterance.voice = voices[0]
  utterance.rate = 1

  window.speechSynthesis.speak(utterance)
}

function init () {
  loadState()
  updateUi()
}

init()
