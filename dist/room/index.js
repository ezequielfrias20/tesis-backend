"use strict";
// import { Socket } from "socket.io";
// // @ts-ignore
// import prisma from "../config/db.config";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
var uuid_1 = require("uuid");
var rooms = {};
var roomHandler = function (socket) {
    var createroom = function () {
        var roomId = (0, uuid_1.v4)();
        rooms[roomId] = [];
        socket.emit('room-created', {
            roomId: roomId
        });
        console.log('user created the room');
    };
    var joinroom = function (_a) {
        var roomId = _a.roomId, peerId = _a.peerId;
        if (rooms[roomId]) {
            console.log('user joined the room: ', roomId, peerId);
            if (!(rooms[roomId].includes(peerId))) {
                rooms[roomId].push(peerId);
            }
            socket.join(roomId);
            socket.emit('get-users', {
                roomId: roomId,
                participants: rooms[roomId]
            });
            socket.to(roomId).emit("user-joined", { peerId: peerId, roomId: roomId });
        }
        socket.on('disconnect', function () {
            console.log("user left the room", peerId);
            leaveRoom({ roomId: roomId, peerId: peerId });
        });
    };
    var leaveRoom = function (_a) {
        var roomId = _a.roomId, peerId = _a.peerId;
        if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(function (id) { return id !== peerId; });
            socket.to(roomId).emit('user-disconnected', peerId);
        }
        else
            (console.log('[room no existe]', roomId));
    };
    socket.on("create-room", createroom);
    socket.on("join-room", joinroom);
};
exports.roomHandler = roomHandler;
