import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId: string): Socket | null {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_WS!, {
      query: { userId },
    });
  }
  return socket;
}
