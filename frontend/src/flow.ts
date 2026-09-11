import { createContext } from 'react'

export type Unit = 'week' | 'month' | 'year'

// amount is null when the graph should work it out from the connections.
export type Rate = { amount: number | null; every: number; unit: Unit }

const MONTHS_PER_UNIT: Record<Unit, number> = { week: 12 / 52, month: 1, year: 12 }

// Everything on the graph is a monthly rate.
export function toMonthly({ amount, every, unit }: Rate): number | null {
  return amount === null || every <= 0 ? null : amount / (every * MONTHS_PER_UNIT[unit])
}

export const money = (n: number) => Math.round(n).toLocaleString()

type Item = { id: string; data: Rate }
type Link = { id: string; source: string; target: string }

export type NodeFlow = {
  flow: number // monthly amount moving through the node
  out: number // total sent along outgoing connections
  short: number // set amount minus what actually arrives, if positive
  unallocated: number // what's left after the outgoing connections take their share
  hasIn: boolean
  hasOut: boolean
}

export type Flows = { nodes: Map<string, NodeFlow>; edges: Map<string, number> }

export const FlowsContext = createContext<Flows>({ nodes: new Map(), edges: new Map() })

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

// Demands travel upstream, leftovers travel downstream. Assumes no cycles (wouldCycle guards that).
export function computeFlows(items: Item[], links: Link[]): Flows {
  const set = new Map(items.map((n) => [n.id, toMonthly(n.data)]))
  const outs = new Map(items.map((n) => [n.id, [] as Link[]]))
  const ins = new Map(items.map((n) => [n.id, [] as Link[]]))
  for (const l of links) {
    outs.get(l.source)?.push(l)
    ins.get(l.target)?.push(l)
  }

  // The least a node needs from its parents: its set amount, or for an empty node,
  // what its own children need. Empty nodes also take a share of whatever is left.
  const floors = new Map<string, number>()
  function floor(id: string): number {
    if (!floors.has(id)) floors.set(id, set.get(id) ?? sum(outs.get(id)!.map(linkFloor)))
    return floors.get(id)!
  }
  // ponytail: a node with several parents asks each for an equal share.
  const linkFloor = (l: Link) => floor(l.target) / ins.get(l.target)!.length
  const isEmpty = (id: string) => set.get(id) == null

  const available = new Map<string, number>()
  const edges = new Map<string, number>()
  const unallocated = new Map<string, number>()

  function flow(id: string): number {
    if (!available.has(id)) {
      const incoming = ins.get(id)!
      available.set(id, incoming.length === 0 ? (set.get(id) ?? 0) : sum(incoming.map(linkFlow)))
    }
    return available.get(id)!
  }
  function linkFlow(l: Link): number {
    if (!edges.has(l.id)) allocate(l.source)
    return edges.get(l.id)!
  }
  function allocate(id: string) {
    const have = flow(id)
    const links = outs.get(id)!
    const asked = sum(links.map(linkFloor))
    // Not enough to go around: every link gets the same fraction of what it needs.
    const scale = asked > have ? have / asked : 1
    const rest = Math.max(0, have - asked)
    const open = links.filter((l) => isEmpty(l.target))
    for (const l of links) edges.set(l.id, linkFloor(l) * scale)
    for (const l of open) edges.set(l.id, edges.get(l.id)! + rest / open.length)
    unallocated.set(id, open.length ? 0 : rest)
  }

  const nodes = new Map<string, NodeFlow>()
  for (const { id } of items) {
    const hasIn = ins.get(id)!.length > 0
    const hasOut = outs.get(id)!.length > 0
    if (hasOut) allocate(id)
    const s = set.get(id)
    nodes.set(id, {
      flow: flow(id),
      out: sum(outs.get(id)!.map(linkFlow)),
      short: hasIn && s != null ? Math.max(0, s - flow(id)) : 0,
      unallocated: unallocated.get(id) ?? 0,
      hasIn,
      hasOut,
    })
  }
  return { nodes, edges }
}

export function wouldCycle(links: Link[], source: string, target: string): boolean {
  const seen = new Set<string>()
  const stack = [target]
  while (stack.length) {
    const id = stack.pop()!
    if (id === source) return true
    if (seen.has(id)) continue
    seen.add(id)
    for (const l of links) if (l.source === id) stack.push(l.target)
  }
  return false
}
