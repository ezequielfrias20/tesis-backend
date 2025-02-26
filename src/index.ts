import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import { roomHandler } from './room';
import Routes from "./routes"
import { ExpressPeerServer } from 'peer';


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

    roomHandler(socket);

    socket.on('disconnect', () => {
        console.log('user is disconnected')
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