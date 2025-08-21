import { Router } from 'express'
import { PrismaClient, Role, RoomStatus } from '@prisma/client'
import { nanoid } from 'nanoid'

export default function roomRouter(prisma: PrismaClient) {
  const r = Router()

  /**
   * POST /room/create
   * Membuat room baru dengan kode unik
   */
  r.post('/create', async (req, res) => {
    try {
      const code = nanoid(6).toUpperCase()
      const room = await prisma.room.create({ data: { code, status: RoomStatus.LOBBY } })
      return res.json({ code: room.code, id: room.id })
    } catch (err) {
      console.error('Error creating room:', err)
      return res.status(500).json({ error: 'Failed to create room' })
    }
  })

  /**
   * POST /room/join
   * Bergabung ke room berdasarkan code, membuat team jika belum ada, dan menambahkan player
   */
  r.post('/join', async (req, res) => {
    try {
      const { code, teamName, userId, role } = req.body

      // Validasi input
      if (!code || !teamName || !userId || !role) {
        return res.status(400).json({ error: 'Missing required fields: code, teamName, userId, role' })
      }

      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.values(Role).join(', ')}` })
      }

      // Cari room
      const room = await prisma.room.findUnique({
        where: { code },
        include: { teams: { include: { players: true } } }
      })
      if (!room) return res.status(404).json({ error: 'Room not found' })

      // Cari atau buat team
      let team = room.teams.find(t => t.name === teamName)
      if (!team) {
        team = await prisma.team.create({
          data: { name: teamName, roomId: room.id },
          include: { players: true }
        })
      }

      // Tambahkan player jika belum ada
      const existingPlayer = team.players.find(p => p.userId === userId)
      if (existingPlayer) {
        return res.json({ roomId: room.id, teamId: team.id, playerId: existingPlayer.id, message: 'Player already joined' })
      }

      const player = await prisma.player.create({
        data: { userId, teamId: team.id, role: role as Role }
      })

      return res.json({ roomId: room.id, teamId: team.id, playerId: player.id })
    } catch (err) {
      console.error('Error joining room:', err)
      return res.status(500).json({ error: 'Failed to join room' })
    }
  })

  return r
}
