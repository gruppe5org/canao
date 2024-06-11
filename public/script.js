let state = {
  server: '192.168.178.21' /* '172.17.15.68' */,
  from: null,
  ollamas: [],
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
  }
  
  if (msg.type == 'compute-end') {
    if (msg.payload && msg.payload.model === state.model) {
      tts(msg.payload.response)
    } else {
      state.computing = ''
    }
  }

  state.models = msg.state.models
  state.mode = msg.state.mode

  updateUi()
})

document.querySelector('#send').addEventListener('click', () => {
  state.model = document.querySelector('#model').value.toLowerCase()
  if (!state.model) return console.log('no model')
  send({
    type: 'model',
    payload: state.model
  })
})

function updateUi () {
  document.querySelector('#from').textContent = state.from
  if (state.ollamas.find((m) => m.name === state.model)) document.querySelector('#model').value = state.model

  if (!state.model || state.computing !== state.model) {
    document.querySelector('body').classList.remove('computing')
  } else {
    document.querySelector('body').classList.add('computing')
  }

  const ul = document.querySelector('#models')
  ul.innerHTML = ''

  state.models.forEach((m) => {
    const li = document.createElement('li')
    li.id = m.model
    li.classList = 'model'
    li.innerHTML = m.model
    ul.appendChild(li)
  })
  
  const select = document.querySelector('#model')
  select.innerHTML = ''

  if (state.ollamas.length === 0) {
    const op = document.createElement('option')
    op.innerHTML = 'no model ⛔️'
    select.appendChild(op)
    document.querySelector('body').classList.add('no-models')
  } else {
    state.ollamas?.forEach((m) => {
      const op = document.createElement('option')
      op.value = m.name
      op.innerHTML = m.name
      select.appendChild(op)
    })
    document.querySelector('body').classList.remove('no-models')
  }

  if (state.computing !== '') {
    console.log('highlight', state.computing)
    document.querySelector(`#${state.computing}`).classList.add('highlight')
  } 
}

async function loadOllama () {
  const url = 'http://localhost:11434/api'

  try {
    const r = await fetch(`${url}/tags`)
    const tags = await r.json()
    const models = tags.models.map((t) => t.name.replace(':latest', ''))
    state.ollamas = await Promise.all(models.map(async (m) => {
      const response = await fetch(`${url}/show`, {
        method: 'POST',
        body: JSON.stringify({
          name: m
        })
      })
      return {
        ...await response.json(),
        name: m,
      }
    }))
    return state.ollamas
  } catch (e) {
    console.log('no ollamas')
    return state.ollamas
  }
}

function loadState () {
  if (localStorage.getItem('state')) {
    state = JSON.parse(localStorage.getItem('state'))
    console.log(state)
  }
}

function saveState () {
  localStorage.setItem('state', JSON.stringify(state))
}

function send (msg) {
  socket.send(JSON.stringify(msg))
}

function tts (text) {
  document.querySelector('body').classList.add('tts')
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
    document.querySelector('body').classList.remove('tts')
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

async function init () {
  await loadOllama()
  updateUi()
}

init()
