import { Server } from 'socket.io'
import express from 'express'
import http from 'http'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

let users = [];
let bets = [];
let round = 0;

io.on('connection', (socket) => {
    console.log('a user connected', socket.id, socket.pseudo)

    socket.on('game', (data) => {
        console.log('setPseudo', data);
        socket.pseudo = data.pseudo;
        console.log('Pseudo set:', socket.pseudo);

        users.push({ pseudo: socket.pseudo, id: socket.id, points: 100 });

        launchGame(socket);

        round(socket);
    });

    socket.on('message', (data) => {
        console.log('message', data);
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        users = users.filter(user => user.id !== socket.id);
        console.log('Updated users list:', users);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000')
})

function launchGame(socket) {
    if (users.length < 3) {
        socket.emit('waiting_room', { message: 'En attente de joueurs' });
        console.log('En attente de joueurs');
    }
    else if (users.length === 3) {
        users.forEach(user => {
            io.to(user.id).emit('start_game', { message: 'La partie va commencer' });
        });
        console.log('La partie va commencer');
        displayCurrentPoints();
    }
    else {
        socket.emit('too_much_player', { message: 'Trop tard. Il y a déjà trop de joueurs' });
        console.log('Trop tard. Il y a déjà trop de joueurs');
    }
}

function round(socket) {
    socket.on('bet', (data) => {
        console.log('bet', data);
        bets.push({ pseudo: socket.pseudo, id: socket.id, bet: data.betValue, setting: data.setting });

        if (bets.length === 3) {
            let result = Math.random() < 0.5;
            result = result ? 'pile' : 'face';
            bets.forEach(bet => {
                if (bet.bet === result) {
                    setUserPoints(bet.id, parseInt(bet.setting), true);
                }
                else {
                    setUserPoints(bet.id, parseInt(bet.setting), false);
                }
            });
            bets = [];
            round++;
        }

        if (round === 1) {
            console.log(round + ' fin de la partie');
            endOfTournament();
            round = 0;
            users = [];
        }
    });
}

function setUserPoints(socketId, setting, result) {
    users = users.map(user => {
        if (user.id === socketId) {
            return {
                ...user,
                points: result ? user.points + setting + 10 : user.points - setting
            };
        }
        else {
            return user;
        }
    });
    displayCurrentPoints();
    console.log(users);
}

function displayCurrentPoints() {
    users.forEach(user => {
        io.to(user.id).emit('current_points', { points: user.points });
    });
}

function endOfTournament() {
    let rankings = users.sort((a, b) => b.points - a.points);
    users.forEach(user => {
        io.to(user.id).emit('end_of_tournament', rankings);
    });
    console.log(rankings);
}
