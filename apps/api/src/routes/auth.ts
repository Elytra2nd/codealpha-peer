import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'

export default function authRouter(prisma: PrismaClient) {
  const r = Router()

  // REGISTER
  r.post('/register', async (req, res) => {
    try {
      const { email, password, name } = req.body

      // cek user sudah ada atau belum
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return res.status(400).json({ error: 'Email already exists' })

      const hashed = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { email, password: hashed, name }
      })
      res.json({ id: user.id })
    } catch (err) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // LOGIN
  r.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })

      const ok = await bcrypt.compare(password, user.password)
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
      res.json({ token })
    } catch (err) {
      res.status(500).json({ error: 'Server error' })
    }
  })

  return r
}
