"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = require("socket.io");
var cors_1 = __importDefault(require("cors"));
var room_1 = require("./room");
var routes_1 = __importDefault(require("./routes"));
var peer_1 = require("peer");
var port = 8080;
var app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
var server = http_1.default.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});
app.use(routes_1.default);
io.on("connection", function (socket) {
    console.log('user is connected');
    (0, room_1.roomHandler)(socket);
    socket.on('disconnect', function () {
        console.log('user is disconnected');
    });
});
// Configuración del servidor PeerJS
var peerServer = (0, peer_1.ExpressPeerServer)(server, {
    path: '/myapp',
});
// servidor PeerJS
app.use('/peerjs', peerServer);
server.listen(port, function () {
    console.log("Listening to the server on ".concat(port));
});
