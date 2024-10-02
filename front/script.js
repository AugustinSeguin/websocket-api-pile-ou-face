// connection to webSocket server

let betValue = "pile";
document.getElementById('waiting-room').style.display = 'none';
document.getElementById('cant-play').style.display = 'none';
document.getElementById('start-game').style.display = 'none';
document.getElementById('waitingplayers').style.display = 'none';

const socket = io('http://localhost:3000')
socket.on('connect', () => {
    console.log('connected');
})


// Pseudo page

const pseudoInput = document.getElementById('pseudo');
const pseudoValiButton = document.getElementById('pseudo-vali');

pseudoValiButton.addEventListener('click', (event) => {
    if (!pseudoInput.value.trim()) {
        event.preventDefault();
        alert('Le pseudo ne peut pas être vide.');
    } else {
        socket.emit('game', ({ pseudo: pseudoInput.value }));
    }
});

socket.on("waiting_room", () => {
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
    }
    else {
        socket.emit("message", {
            message: messageInput.value, pseudo: pseudoInput.value
        });
        messageInput.value = '';
    }
});

socket.on('message', (data) => {
    console.log(data);
    document.getElementById('messages').innerHTML += '<p>';
    document.getElementById('messages').innerText += `${data.pseudo}: ${data.message}`;
    document.getElementById('messages').innerHTML += '<br> </p>';

});

// Too much players page

socket.on("waiting_room", () => {
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('welcome').style.display = 'none';
    console.log('waiting room');
});

socket.on("too_much_player", () => {
    document.getElementById('cant-play').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    console.log('too much players');
});

// Start playing page

let betInput = document.getElementById('bet-input');
const betValiButton = document.getElementById('validate-bet');
const pileButton = document.getElementById('pile');
const faceButton = document.getElementById('face');

socket.on("start_game", () => {
    document.getElementById('cant-play').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('start-game').style.display = 'block';
    console.log('Start game');
});

pileButton.addEventListener('click', () => {
    betValue = 'pile';
    console.log(betValue);
}
);

faceButton.addEventListener('click', () => {
    betValue = 'face';
    console.log(betValue);
});

// timer

// let timer = setTimeout(bet, 10000);

// function bet(event) {
betValiButton.addEventListener('click', (event) => {
    document.getElementById('waitingplayers').style.display = 'block';
    document.getElementById('game').style.display = 'none';
    console.log(betValue);
    socket.emit("bet", {
        betValue: betValue, pseudo: pseudoInput.value, setting: betInput.value
    });
    console.log({
        betValue: betValue, pseudo: pseudoInput.value, setting: betInput.value
    });
});

socket.on('current_points', (data) => {
    document.getElementById('waitingplayers').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    console.log(data);
    document.getElementById('current-points').innerText = `Points actuels : ${data.points}`;
});

// bet()
// clearTimeout(timer);


// display result
socket.on('end_of_tournament', (data) => {
    document.getElementById('waitingplayers').style.display = 'none';
    document.getElementById('game').style.display = 'none';
    console.log(data);
    data.forEach((user, index) => {
        document.getElementById('end-of-tournement').innerHTML += '<p>';
        document.getElementById('end-of-tournement').innerText += `${index} : ${user.pseudo} - ${user.points} points`;
        document.getElementById('end-of-tournement').innerHTML += '<br> </p>';
    });
});

