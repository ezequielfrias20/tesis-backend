import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
// import { roomHandler } from './room';
import Routes from "./routes"
import { ExpressPeerServer } from 'peer';
import {v4 as uuidV4} from 'uuid';
import prisma from './config/db.config';

interface IRoomParams {
    roomId: string;
    peerId:string
}

const port = 8080;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

app.use(Routes);

io.on("connection", (socket) => {
    console.log('user is connected');

    // roomHandler(socket);

    const createRoom = async () => {
        const roomId = uuidV4();
        console.log('Creating room with ID:', roomId);
        try {
            await prisma.room.create({
                data: {
                    roomId,
                    peers: [] // Inicialmente vacío
                }
            });
            socket.emit('room-created', { roomId });
            console.log('Room created and saved to DB:', roomId);
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('room-creation-error', { error: 'Failed to create room' });
        }
    };

    const joinRoom = async ({ roomId, peerId }: IRoomParams) => {
        try {
            const room = await prisma.room.findUnique({
                where: { roomId }
            });

            if (!room) {
                socket.emit('room-not-found', { roomId });
                return;
            }

            // Evitar duplicados
            if (!room.peers.includes(peerId)) {
                await prisma.room.update({
                    where: { roomId },
                    data: {
                        peers: { push: peerId }
                    }
                });
            }

            socket.join(roomId);
            socket.emit('get-users', {
                roomId,
                participants: room.peers
            });
            console.log("PARTICIPANTES QUE SE ENVIAN: ", { peerId, roomId })
            socket.to(roomId).emit('user-joined', { peerId, roomId });

            // console.log('User joined room:', peerId, roomId);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    const leaveRoom = async ({ roomId, peerId }: IRoomParams) => {
        try {
            const room = await prisma.room.findUnique({
                where: { roomId }
            });

            if (room) {
                const updatedPeers = room.peers.filter((id: string) => id !== peerId);
                await prisma.room.update({
                    where: { roomId },
                    data: { peers: updatedPeers }
                });

                socket.to(roomId).emit('user-disconnected', peerId);
                console.log('User left room:', peerId);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };



    socket.on('create-room', createRoom);
    socket.on('join-room', joinRoom);
    socket.on('leave-room', leaveRoom);
    socket.on('disconnect', (params) => {
        console.log('user is disconnected', params)
    })
})

// Configuración del servidor PeerJS
const peerServer = ExpressPeerServer(server, {
    path: '/myapp',
  });

// servidor PeerJS
app.use('/peerjs', peerServer);

server.listen(port, () => {
    console.log(`Listening to the server on ${port}`)
})