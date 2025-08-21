'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSocket } from '../../../lib/socket'

type Module = { type: string; state: any; id?: string }

export default function RoomPage({ params }: { params: { code: string } }) {
  const sp = useSearchParams()
  const teamName = sp.get('team') || 'Team A'
  const [modules, setModules] = useState<Module[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const userId = useMemo(() => crypto.randomUUID(), [])

  useEffect(() => {
    const socket = getSocket(userId)
    socket?.emit('room:join', { roomCode: params.code, teamName })

    socket?.on('game:started', ({ modules }) => setModules(modules))
    socket?.on('module:updated', ({ moduleId, state, solved }) => {
      setModules(prev => prev.map(m => (m.id === moduleId ? { ...m, state, solved } : m)))
    })
    socket?.on('chat:message', (msg) => setMessages(prev => [...prev, msg]))

    return () => {
      socket?.off('game:started')
      socket?.off('module:updated')
      socket?.off('chat:message')
    }
  }, [params.code, teamName, userId])

  const startGame = () => {
    const socket = getSocket(userId)
    socket?.emit('room:start', { roomCode: params.code })
  }

  const sendHint = (text: string) => {
    const socket = getSocket(userId)
    socket?.emit('chat:hint', { roomId: params.code, from: userId, to: 'DEFUSER', text })
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <h2 className="text-2xl font-semibold">Room {params.code}</h2>
      <div className="flex gap-4">
        <button onClick={startGame} className="px-3 py-2 bg-indigo-600 text-white rounded">
          Mulai
        </button>
        <HintBox onSend={sendHint} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {modules.map((m, idx) => (
          <ModuleCard key={idx} roomCode={params.code} userId={userId} module={m} />
        ))}
      </div>
      <div className="bg-white rounded shadow p-3">
        <h3 className="font-medium mb-2">Chat/Hints</h3>
        <ul className="space-y-1">
          {messages.map((m, i) => <li key={i} className="text-sm"><b>{m.type}:</b> {m.text}</li>)}
        </ul>
      </div>
    </div>
  )
}

function HintBox({ onSend }: { onSend: (t: string)=>void }) {
  const [t, setT] = useState('')
  return (
    <div className="flex gap-2">
      <input className="border p-2 rounded" value={t} onChange={e=>setT(e.target.value)} placeholder="Kirim hint ke Defuser" />
      <button onClick={()=>{ onSend(t); setT('') }} className="px-3 py-2 bg-green-600 text-white rounded">Kirim</button>
    </div>
  )
}

function ModuleCard({ module, roomCode, userId }:{ module: any, roomCode: string, userId: string }) {
  if (module.type === 'wire') return <WireModule module={module} roomCode={roomCode} userId={userId} />
  if (module.type === 'symbols') return <SymbolsModule module={module} roomCode={roomCode} userId={userId} />
  return <div className="p-3 bg-white rounded shadow">Unknown module</div>
}

function WireModule({ module, roomCode, userId }:{ module:any, roomCode:string, userId:string }) {
  const cut = (index:number) => {
    const socket = getSocket(userId)
    socket?.emit('module:action', { roomId: roomCode, moduleId: module.id, action: { type:'CUT', index } })
  }
  return (
    <div className="p-3 bg-white rounded shadow space-y-2">
      <h4 className="font-semibold">Wire Module</h4>
      <div className="flex gap-2">
        {module.state.wires?.map((c:string, i:number)=>(
          <button key={i} onClick={()=>cut(i)} className="px-3 py-2 border rounded">{c}</button>
        ))}
      </div>
    </div>
  )
}

function SymbolsModule({ module, roomCode, userId }:{ module:any, roomCode:string, userId:string }) {
  const input = (symbol:string) => {
    const socket = getSocket(userId)
    socket?.emit('module:action', { roomId: roomCode, moduleId: module.id, action: { type:'INPUT', symbol } })
  }
  const options = ['Ω','Ψ','λ','π','Σ','Φ','Δ','Θ']
  return (
    <div className="p-3 bg-white rounded shadow space-y-2">
      <h4 className="font-semibold">Symbols Module</h4>
      <div className="flex gap-2 flex-wrap">
        {options.map((s)=>(
          <button key={s} onClick={()=>input(s)} className="px-3 py-2 border rounded">{s}</button>
        ))}
      </div>
    </div>
  )
}
 