import { PrismaClient, RoomStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function createRoom() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // kode 6 karakter
  const room = await prisma.room.create({
    data: {
      code: code,
      status: RoomStatus.LOBBY // pakai LOBBY sesuai enum Prisma-mu
    }
  });
  console.log("Kode room:", room.code);
  return room.code;
}

createRoom()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
