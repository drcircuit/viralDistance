// Dependencies
const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const port = process.env.PORT || 5000;
app.set("port", port);
app.use("/", express.static(__dirname + "/static"));
// Routing

// Starts the server.
server.listen(port, function () {
    console.log("Starting server on port 5000");
});

let players = {};
io.on('connection', function (socket) {

    socket.on('new player', function () {
        players[socket.id] = {
            x: 300,
            y: 300
        };
    });
    socket.on('movement', function (data) {
        var player = players[socket.id] || {};
        player.x = data.pos.x;
        player.y = data.pos.y;
        player.size = data.size;
    });
    socket.on('disconnect', () => {
        delete players[socket.id];
        socket.emit("kill", socket.id);
    });

});
setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);