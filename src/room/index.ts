// import { Socket } from "socket.io";
// // @ts-ignore
// import prisma from "../config/db.config";

// interface IRoomParams {
//     roomId: string;
//     peerId:string
// }

// export const roomHandler = (socket: Socket) => {
//     const createroom = async () => {
//         // const roomId = uuidV4();
//         // rooms[roomId] = [];
//         const response = await prisma.room.create({
//             data: {}
//         });
//         console.log("room c: ", response)
//         socket.emit('room-created', {
//             roomId: response?.id
//         })
//         console.log('user created the room');
//     };
//     const joinroom = async ({ roomId, peerId }: IRoomParams) => {
//         const room = await prisma.room.findUnique({
//             where: {
//               id: roomId, // Aquí se pasa el ID que quieres buscar
//             },
//             include: {
//                 participants: true, // Incluir la relación con los participantes
//             },
//           });
//         if (room) {
//             console.log('user joined the room: ', roomId, peerId);
//             if (!(room.participants.some((i: any) => i?.peerId === peerId))) {
//                 const participant = await prisma.participant.create({
//                     data: {
//                         peerId,
//                         roomId,
//                     }
//                 });
//                 room.participants = [...room.participants, participant]
//             }

//             socket.join(roomId);
//             socket.emit('get-users', {
//                 roomId,
//                 participants: room.participants
//             })

//             socket.to(roomId).emit("user-joined", { peerId, roomId });
//         }

//         socket.on('disconnect', () => {
//             console.log(`user left the room`, peerId);
//             leaveRoom({roomId, peerId})
//         })

//     };

//     const leaveRoom = async ({roomId, peerId}: IRoomParams) => {
//         try {
//             const participant = await prisma.participant.findFirst({
//                 where: {
//                     peerId,
//                     roomId,
//                 },
//               });
//             if (participant) {
//                 await prisma.participant.delete({
//                     where: {
//                         id: participant.id,
//                     },
//                 });
//                 socket.to(roomId).emit('user-disconnected', peerId)
//             } else (
//                 console.log('[room no existe]', roomId)
//             )
//         } catch (error) {
//             console.log(error)
//         }


//     }
//     socket.on("create-room", createroom);
//     socket.on("join-room", joinroom);
// }

import { Socket } from "socket.io";
import prisma from '../config/db.config';
import {v4 as uuidV4} from 'uuid';


// const rooms: Record<string, string[]> = {}

interface IRoomParams {
    roomId: string;
    peerId:string
}

export const roomHandler = (socket: Socket) => {
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

            console.log('User joined room:', peerId, roomId);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    // const leaveRoom = async ({ roomId, peerId }: IRoomParams) => {
    //     try {
    //         const room = await prisma.room.findUnique({
    //             where: { roomId }
    //         });

    //         if (room) {
    //             const updatedPeers = room.peers.filter((id: string) => id !== peerId);
    //             await prisma.room.update({
    //                 where: { roomId },
    //                 data: { peers: updatedPeers }
    //             });

    //             socket.to(roomId).emit('user-disconnected', peerId);
    //             console.log('User left room:', peerId);
    //         }
    //     } catch (error) {
    //         console.error('Error leaving room:', error);
    //     }
    // };

    socket.on('create-room', createRoom);
    socket.on('join-room', joinRoom);
    // socket.on('leave-room', leaveRoom);
    // socket.on('disconnect', () => {
    //     // Opcional: Manejar desconexiones abruptas si tienes el peerId
    // });
};