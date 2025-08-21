import { Server, Socket } from 'socket.io'
import { PrismaClient, RoomStatus } from '@prisma/client'
import { Redis } from 'ioredis' // ✅ ioredis v5 menggunakan named import
import { generateModules, applyAction } from './modules.js'

type AuthedSocket = Socket & { userId?: string }

export function createSocketHandlers(io: Server, prisma: PrismaClient) {
  // Gunakan Redis.fromURL untuk ioredis v5
  const pub = new Redis(process.env.REDIS_URL!)
  const sub = new Redis(process.env.REDIS_URL!)

  io.on('connection', (socket: AuthedSocket) => {
    // Ambil userId dari query string
    const { userId } = socket.handshake.query as any
    socket.userId = userId

    // Join room
    socket.on('room:join', async ({ roomCode, teamName }) => {
      const room = await prisma.room.findUnique({ where: { code: roomCode } })
      if (!room) return socket.emit('error', 'Room not found')

      socket.join(room.id)
      io.to(room.id).emit('room:joined', { userId: socket.userId, teamName })
    })

    // Start game dan generate modules
    socket.on('room:start', async ({ roomCode }) => {
      const room = await prisma.room.findUnique({ where: { code: roomCode } })
      if (!room) return

      const generated = generateModules()
      const createdModules: Array<{ id: string; type: string; state: any; solved: boolean }> = []

      for (const m of generated) {
        const rec = await prisma.moduleInstance.create({
          data: { roomId: room.id, type: m.type, state: m.state }
        })
        createdModules.push({
          id: rec.id,
          type: rec.type,
          state: rec.state,
          solved: rec.solved
        })
      }

      await prisma.room.update({
        where: { id: room.id },
        data: { status: RoomStatus.RUNNING }
      })

      io.to(room.id).emit('game:started', { modules: createdModules })
    })

    // Handle module action
    socket.on('module:action', async ({ roomId, moduleId, action }) => {
      const mod = await prisma.moduleInstance.findUnique({ where: { id: moduleId } })
      if (!mod) return

      const result = applyAction(mod.type as 'wire' | 'symbols', mod.state as any, action)

      if (result.updatedState) {
        await prisma.moduleInstance.update({
          where: { id: moduleId },
          data: {
            state: result.updatedState,
            solved: result.solved ?? mod.solved
          }
        })
      }

      io.to(roomId).emit('module:updated', {
        moduleId,
        state: result.updatedState,
        solved: result.solved ?? mod.solved
      })

      if (result.penalty) {
        io.to(roomId).emit('game:penalty', { seconds: result.penalty })
      }
    })

    // Chat hint
    socket.on('chat:hint', ({ roomId, from, to, text }) => {
      io.to(roomId).emit('chat:message', { from, to, text, type: 'hint' })
    })

    socket.on('disconnect', () => {
      // Optional: cleanup user state
    })
  })

  // Opsional Redis adapter untuk horizontal scaling
  // import { createAdapter } from '@socket.io/redis-adapter'
  // io.adapter(createAdapter(pub, sub))
}
