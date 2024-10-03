import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const roomData = {};
let users = [];
let bets = [];

let roomCounter = 1;
const maxPlayersPerRoom = 3;

function getRooms() {
  let rooms = Array.from(io.sockets.adapter.rooms);

  // Filtrer les rooms qui commencent par 'room' et qui ont moins de 3 personnes
  rooms = rooms.filter(
    ([roomName, room]) => roomName.startsWith('room') && room.size < 3
  );

  // Mapper pour obtenir uniquement les noms des rooms
  rooms = rooms.map(([roomName]) => roomName);

  return rooms;
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id, socket.pseudo);

  socket.emit('getRooms', getRooms());

  socket.on('game', (data) => {
    let roomName = `room-${roomCounter}`;

    socket.pseudo = data.pseudo;
    if (data.room) {
      roomName = data.room;
    }
    let room = io.sockets.adapter.rooms.get(roomName);

    if (room && room.size >= maxPlayersPerRoom) {
      roomCounter++;
      roomName = `room-${roomCounter}`;
      room = io.sockets.adapter.rooms.get(roomName);
    }
    socket.roomName = roomName;
    console.log(data.pseudo + ' a rjoint la room ' + roomName);
    socket.join(roomName);

    io.emit('getRooms', getRooms());

    if (!roomData[roomName]) {
      roomData[roomName] = { users: [], bets: [], rounds: 0 };
    }
    roomData[roomName].users.push({
      pseudo: socket.pseudo,
      id: socket.id,
      points: 100,
    });

    const numberOfClients = room ? room.size : 0;
    console.log('NbClient room', numberOfClients);
    // launchGame(socket);

    io.to(roomName).emit('waiting_room', { message: 'En attente de joueurs' });

    if (numberOfClients === 3) {
      io.to(roomName).emit('start_game', { message: 'La partie va commencer' });
      console.log('La partie va commencer');
    }

    socket.on('bet', (data) => {
      console.log('bet', data);
      if (!roomData[roomName]) {
        roomData[roomName] = { bets: [] };
      }
      roomData[roomName].bets.push({
        pseudo: socket.pseudo,
        id: socket.id,
        bet: data.betValue,
        setting: data.setting,
      });

      if (roomData[roomName].bets.length === 3) {
        let result = Math.random() < 0.5;
        result = result ? 'pile' : 'face';
        roomData[roomName].bets.forEach((bet) => {
          if (bet.bet === result) {
            setUserPoints(
              bet.id,
              parseInt(bet.setting),
              true,
              roomData[roomName]
            );
          } else {
            setUserPoints(
              bet.id,
              parseInt(bet.setting),
              false,
              roomData[roomName]
            );
          }
        });
        roomData[roomName].bets = [];
        roomData[roomName].rounds += 1;
      }

      if (roomData[roomName].rounds === 3) {
        console.log(roomData[roomName].rounds + ' fin de la partie');
        endOfTournament(roomName, roomData[roomName]);
        roomData[roomName].rounds = 0;
        roomData[roomName].users = [];
      }
    });
  });

  socket.on('message', (data) => {
    console.log(socket);
    console.log('message', data);
    console.log(socket.rooms[1]);
    io.to(socket.roomName).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    users = users.filter((user) => user.id !== socket.id);
    console.log('Updated users list:', users);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

function setUserPoints(socketId, setting, result, roomData) {
  roomData.users = roomData.users.map((user) => {
    if (user.id === socketId) {
      return {
        ...user,
        points: result ? user.points + setting + 10 : user.points - setting,
      };
    } else {
      return user;
    }
  });
  displayCurrentPoints(roomData);
  console.log(users);
}

function displayCurrentPoints(roomData) {
  roomData.users.forEach((user) => {
    io.to(user.id).emit('current_points', { points: user.points });
  });
}
function endOfTournament(roomName, roomData) {
  let rankings = roomData.users.sort((a, b) => b.points - a.points);

  io.to(roomName).emit('end_of_tournament', rankings);
}
