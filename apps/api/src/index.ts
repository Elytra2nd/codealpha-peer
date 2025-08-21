import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { createSocketHandlers } from './sockets'
import authRouter from './routes/auth'
import roomRouter from './routes/room'

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

app.use('/auth', authRouter(prisma))
app.use('/room', roomRouter(prisma))

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

createSocketHandlers(io, prisma)

const port = process.env.PORT || 4000
httpServer.listen(port, () => console.log(`API listening on ${port}`))
