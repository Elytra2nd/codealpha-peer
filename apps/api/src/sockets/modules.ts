export type WireState = {
  wires: string[]
  correctIndex: number
  attempts: number
  solved: boolean
}

export type SymbolsState = {
  seq: string[]
  input: string[]
  solved: boolean
}

export type ModuleState = WireState | SymbolsState

export type Module = {
  type: 'wire' | 'symbols'
  state: ModuleState
}

// Fungsi untuk menghasilkan semua modul
export function generateModules(): Module[] {
  return [
    { type: 'wire', state: genWireState() },
    { type: 'symbols', state: genSymbolsState() }
  ]
}

// State generator untuk modul "wire"
function genWireState(): WireState {
  const colors = ['red', 'blue', 'green', 'yellow']
  const wires = Array.from({ length: 4 }, () => colors[Math.floor(Math.random() * colors.length)])
  const correctIndex = Math.floor(Math.random() * 4)
  return { wires, correctIndex, attempts: 0, solved: false }
}

// State generator untuk modul "symbols"
function genSymbolsState(): SymbolsState {
  const symbols = ['Ω', 'Ψ', 'λ', 'π', 'Σ', 'Φ', 'Δ', 'Θ']
  const seq = Array.from({ length: 4 }, () => symbols[Math.floor(Math.random() * symbols.length)])
  return { seq, input: [], solved: false }
}

// Fungsi untuk menerapkan aksi pada modul
export function applyAction(
  type: 'wire' | 'symbols',
  state: ModuleState,
  action: any
): { updatedState: ModuleState; solved: boolean; penalty?: number } {
  if (type === 'wire') {
    const wireState = state as WireState
    if (wireState.solved) return { updatedState: wireState, solved: true }
    if (action.type === 'CUT' && typeof action.index === 'number') {
      if (action.index === wireState.correctIndex) {
        wireState.solved = true
        return { updatedState: wireState, solved: true }
      } else {
        wireState.attempts += 1
        return { updatedState: wireState, solved: false, penalty: 5 }
      }
    }
    return { updatedState: wireState, solved: false }
  }

  if (type === 'symbols') {
    const symbolsState = state as SymbolsState
    if (symbolsState.solved) return { updatedState: symbolsState, solved: true }
    if (action.type === 'INPUT' && typeof action.symbol === 'string') {
      symbolsState.input.push(action.symbol)
      if (symbolsState.input.length === symbolsState.seq.length) {
        const ok = symbolsState.input.every((s, i) => s === symbolsState.seq[i])
        if (ok) {
          symbolsState.solved = true
          return { updatedState: symbolsState, solved: true }
        } else {
          symbolsState.input = []
          return { updatedState: symbolsState, solved: false, penalty: 5 }
        }
      }
      return { updatedState: symbolsState, solved: false }
    }
    return { updatedState: symbolsState, solved: false }
  }

  return { updatedState: state, solved: false }
}
