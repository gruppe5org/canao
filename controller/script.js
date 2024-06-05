let state = {
  server: '172.17.13.105',
  from: null,
  model: '',
  models: [],
  mode: ''
}

const socket = new WebSocket(`ws://${state.server}:2125`)

document.querySelector('#compute').addEventListener('click', () => {
  if (!state.compute) {
    state.compute = true
    document.querySelector('#compute').textContent = 'STOP'
    initialPrompt = document.querySelector('#initial-prompt').value
    if (!initialPrompt) return console.log('no initial prompt')
    else {
      send({
        type: 'compute',
        payload: initialPrompt
      })
    }
  } else {
    state.compute = false
    document.querySelector('#compute').textContent = 'COMPUTE'
    send({
      type: 'abort'
    })
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
  state.models = msg.state.models
  updateUi()
})

function updateUi () {
  document.querySelector('#clients').textContent = state.models.length

  let list = document.getElementById('list')
  list.innerHTML = ''

  state.models.forEach(function (item) {
    let newItem = document.createElement('div')
    newItem.innerHTML = item.model
    list.appendChild(newItem)
  })
}

function send (msg) {
  console.log('send', msg)
  socket.send(JSON.stringify(msg))
}
