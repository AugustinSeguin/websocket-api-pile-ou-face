// connection to webSocket server

let betValue = 'pile';
document.getElementById('waiting-room').style.display = 'none';
document.getElementById('cant-play').style.display = 'none';
document.getElementById('start-game').style.display = 'none';
document.getElementById('waitingplayers').style.display = 'none';
document.getElementById('newRoom').style.display = 'block';

let allRooms = [];
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  console.log('connected');
});

// Pseudo page

const pseudoInput = document.getElementById('pseudo');
const pseudoValiButton = document.getElementById('pseudo-vali');
const roomSelect = document.getElementById('room-select');

roomSelect.addEventListener('change', (event) => {
  const selectedValue = event.target.value;
  console.log('Valeur sélectionnée:', selectedValue);

  if (selectedValue === 'addRoom') {
    document.getElementById('newRoom').style.display = 'block';
  } else {
    document.getElementById('newRoom').style.display = 'none';
  }
});

pseudoValiButton.addEventListener('click', (event) => {
  if (!pseudoInput.value.trim()) {
    event.preventDefault();
    alert('Le pseudo ne peut pas être vide.');
  } else {
    if (roomSelect.value) {
      if (roomSelect.value === 'addRoom') {
        // document.getElementById('newRoom').style.display = 'block';
        let roomName = document.getElementById('roomName').value;
        if (!allRooms.includes('room-' + roomName)) {
          socket.emit('game', {
            pseudo: pseudoInput.value,
            room: 'room-' + roomName,
          });
        } else {
          alert(`La room ${'room-' + roomName} existe déjà`);
        }
      } else {
        socket.emit('game', {
          pseudo: pseudoInput.value,
          room: roomSelect.value,
        });
      }
    } else {
      socket.emit('game', { pseudo: pseudoInput.value });
    }
  }
});

socket.on('getRooms', (data) => {
  if (Array.isArray(data) && data.length > 0) {
    const roomSelect = document.getElementById('room-select');

    // Vider toutes les options existantes
    roomSelect.innerHTML = '';

    // Ajouter l'option "Créer nouvelle room"
    const createNewRoomOption = document.createElement('option');
    createNewRoomOption.value = 'addRoom';
    createNewRoomOption.textContent = 'Créer nouvelle room';
    roomSelect.appendChild(createNewRoomOption);

    // Ajouter les nouvelles options
    data.forEach((room) => {
      const option = document.createElement('option');
      option.value = room;
      option.textContent = room;
      roomSelect.appendChild(option);
    });

    // Mettre à jour allRooms avec les nouvelles données
    allRooms = data;
  } else {
    roomSelect.innerHTML = '';
    const createNewRoomOption = document.createElement('option');
    createNewRoomOption.value = 'addRoom';
    createNewRoomOption.textContent = 'Créer nouvelle room';
    roomSelect.appendChild(createNewRoomOption);
  }
});

socket.on('waiting_room', () => {
  document.getElementById('waiting-room').style.display = 'block';
  document.getElementById('welcome').style.display = 'none';
  console.log('waiting room');
});

// Waiting room page

const sendButton = document.getElementById('send');
const messageInput = document.getElementById('newMessage');

sendButton.addEventListener('click', (event) => {
  if (!messageInput.value.trim()) {
    event.preventDefault();
  } else {
    socket.emit('message', {
      message: messageInput.value,
      pseudo: pseudoInput.value,
    });
    messageInput.value = '';
  }
});

socket.on('message', (data) => {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('p');
  messageElement.textContent = `${data.pseudo}: ${data.message}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
// Too much players page

socket.on('waiting_room', () => {
  document.getElementById('waiting-room').style.display = 'block';
  document.getElementById('welcome').style.display = 'none';
  console.log('waiting room');
});

socket.on('too_much_player', () => {
  document.getElementById('cant-play').style.display = 'block';
  document.getElementById('waiting-room').style.display = 'none';
  document.getElementById('welcome').style.display = 'none';
  console.log('too much players');
});

// Start playing page

let betInput = document.getElementById('bet-input');

const pileButton = document.getElementById('pile');
const faceButton = document.getElementById('face');

socket.on('start_game', () => {
  document.getElementById('cant-play').style.display = 'none';
  document.getElementById('waiting-room').style.display = 'none';
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('start-game').style.display = 'block';
  console.log('Start game');
});

pileButton.addEventListener('click', () => {
  betValue = 'pile';
  console.log(betValue);
  bet();
});

faceButton.addEventListener('click', () => {
  betValue = 'face';
  bet();
  console.log(betValue);
});

// timer

// let timer = setTimeout(bet, 10000);
const bet = () => {
  document.getElementById('waitingplayers').style.display = 'block';
  document.getElementById('game').style.display = 'none';
  console.log(betValue);
  socket.emit('bet', {
    betValue: betValue,
    pseudo: pseudoInput.value,
    setting: betInput.value,
  });
  console.log({
    betValue: betValue,
    pseudo: pseudoInput.value,
    setting: betInput.value,
  });
};

socket.on('current_points', (data) => {
  document.getElementById('waitingplayers').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  console.log(data);
  document.getElementById(
    'current_points'
  ).innerText = `Points actuels : ${data.points}`;
});

// bet()
// clearTimeout(timer);

// display result
socket.on('end_of_tournament', (data) => {
  document.getElementById('waitingplayers').style.display = 'none';
  document.getElementById('game').style.display = 'none';
  document.getElementById('current_points').style.display = 'none';
  document.getElementById('start-game').style.display = 'none';
  document.getElementById('end_of_tournament').style.display = 'block';
  launchConfetti();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // Clear previous results
  data.forEach((user, index) => {
    const resultP = document.createElement('p');
    resultP.textContent = `${index + 1} : ${user.pseudo} - ${
      user.points
    } points`;
    resultsDiv.appendChild(resultP);
  });
});

// Fonction pour lancer les confettis
function launchConfetti() {
  // Configuration de base des confettis
  const duration = 5 * 1000; // Durée de l'effet en millisecondes
  const animationEnd = Date.now() + duration;
  const defaults = {
    spread: 60,
    ticks: 60,
    origin: { y: 0.6 },
  };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // Lancer les confettis
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    );
  }, 250);
}
