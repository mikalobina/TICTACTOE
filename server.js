const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { v4: uuidv4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

let rooms = {};

app.get('/', (req, res) => res.render('index'));

app.get('/room/:id', (req, res) => {
    const roomId = req.params.id;
    if (!rooms[roomId]) {
        return res.redirect('/');
    }
    res.render('game', { roomId });
});

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const roomId = uuidv4().slice(0, 6);
        rooms[roomId] = {
            players: [],
            board: Array(9).fill(''),
            turn: 'X',
            score: { X: 0, O: 0 }
        };
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) return socket.emit('errorMsg', 'Room not found!');
        const room = rooms[roomId];
        if (room.players.length >= 2) return socket.emit('errorMsg', 'This room is full!');

        room.players.push({ id: socket.id, symbol: room.players.length === 0 ? 'X' : 'O' });
        socket.join(roomId);
        socket.roomId = roomId;

        const player = room.players.find(p => p.id === socket.id);
        socket.emit('assignSymbol', player.symbol);

        if (room.players.length === 1) {
            socket.emit('showLobby');
        } else {
            io.to(roomId).emit('startGame', { turn: room.turn, board: room.board, score: room.score });
        }
    });

    socket.on('makeMove', (index) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        const player = room.players.find(p => p.id === socket.id);

        if (player.symbol === room.turn && room.board[index] === '') {
            room.board[index] = room.turn;
            io.to(roomId).emit('updateBoard', { board: room.board, turn: room.turn });

            if (checkWin(room.board, room.turn)) {
                room.score[room.turn]++;
                return io.to(roomId).emit('gameOver', { winner: room.turn, score: room.score });
            }
            if (!room.board.includes('')) {
                return io.to(roomId).emit('gameOver', { winner: null, score: room.score });
            }

            room.turn = room.turn === 'X' ? 'O' : 'X';
            io.to(roomId).emit('nextTurn', room.turn);
        }
    });

    socket.on('playAgain', () => {
        const roomId = socket.roomId;
        if (!rooms[roomId]) return;
        const room = rooms[roomId];

        room.board = Array(9).fill('');
        room.turn = 'X';
        io.to(roomId).emit('startGame', { turn: room.turn, board: room.board, score: room.score });
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);

        if (rooms[roomId].players.length < 2 && rooms[roomId].players.length > 0) {
            io.to(roomId).emit('opponentLeft');
        } else if (rooms[roomId].players.length === 0) {
            delete rooms[roomId];
        }
    });
});

function checkWin(board, turn) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(p => p.every(i => board[i] === turn));
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server is running on port ${PORT}`));