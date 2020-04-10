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
    socket.on('new player', function (color) {
        try {
            players[socket.id] = {
                x: 300 * Math.random(),
                y: 300 * Math.random(),
                color: color,
                size: 50,
                name: socket.id
            };
        } catch (e) {
            console.error(e);
        }
    });
    socket.on('movement', function (data) {
        if(!data){
            return;
        }
        try {
            var player = players[socket.id] || {};
            player.x = data.pos.x;
            player.y = data.pos.y;
            player.size = data.size;
            player.name = data.name;
        } catch (e) {
            console.error(e);
        }
    });
    socket.on('disconnect', () => {
        try {
            delete players[socket.id];
            socket.emit("kill", socket.id);
        } catch (e) {
            console.error(e);
        }
    });
    socket.on("hit", (what) => {
        if(!what){
            return;
        }
        try {
            let p = players[what.id];
            if(!p){
                return;
            }
            players[what.id].size -= what.size / 10;
            if(players[what.id].size < 0){
                players[what.id].size = 0;
            }
            socket.emit("bang", what.id);
        } catch (e) {
            console.error(e);
        }
    });

});
setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);