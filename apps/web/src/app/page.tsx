'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [teamName, setTeamName] = useState('Team A');

  const createRoom = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_HTTP}/room/create`);
      const { code } = res.data;
      window.location.href = `/room/${code}`;
    } catch (err) {
      console.error('Gagal membuat room:', err);
    }
  };

  const joinRoom = () => {
    if (!roomCode) return;
    window.location.href = `/room/${roomCode}?team=${encodeURIComponent(teamName)}`;
  };

  return (
    <main className="max-w-xl mx-auto py-16 space-y-6">
      <h1 className="text-3xl font-bold">CodeAlpha: Peer Learning</h1>

      <button
        onClick={createRoom}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Buat Room
      </button>

      <div className="p-4 bg-white rounded shadow space-y-3">
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="border p-2 w-full"
          placeholder="Nama Tim"
        />
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="border p-2 w-full"
          placeholder="Kode Room"
        />
        <button
          onClick={joinRoom}
          className="px-4 py-2 bg-green-600 text-white rounded w-full"
        >
          Gabung Room
        </button>
      </div>
    </main>
  );
}
