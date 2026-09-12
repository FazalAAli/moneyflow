import { createContext } from 'react'

export type Unit = 'week' | 'month' | 'year'

// amount is an expression: empty when the graph should work it out from the connections,
// otherwise anything JS can evaluate. $pool is everything the parent sends out, $auto is
// the share this node would have got if the amount were left empty, and any other $name
// comes from the variables table.
export type Rate = { amount: string; every: number; unit: Unit }

export type Vars = Record<string, number>

const MONTHS_PER_UNIT: Record<Unit, number> = { week: 12 / 52, month: 1, year: 12 }

// $pool and $auto are the two the parent has to fill in while it shares out.
export const usesFlowVars = (amount: string) => /\$(pool|auto)\b/.test(amount)

// ponytail: new Function is fine, the only author of these expressions is the only user.
type Expr = (v: Vars) => unknown
const compiled = new Map<string, Expr | null>()
function compile(src: string): Expr | null {
  if (!compiled.has(src)) {
    try {
      const body = src.replace(/\$([A-Za-z_]\w*)/g, 'v.$1')
      compiled.set(src, new Function('v', `return (${body})`) as Expr)
    } catch {
      compiled.set(src, null)
    }
  }
  return compiled.get(src)!
}

// Everything on the graph is a monthly rate. null means "work it out".
export function toMonthly({ amount, every, unit }: Rate, vars: Vars = {}): number | null {
  const src = amount.trim()
  if (!src || every <= 0) return null
  let value: unknown
  try {
    value = compile(src)?.(vars)
  } catch {
    return null
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value / (every * MONTHS_PER_UNIT[unit])
}

export const money = (n: number) => Math.round(n).toLocaleString()

// ponytail: display only. The engine stays monthly; this restates it in the sheet's cadence.
// Swap to a per-node cadence if streams ever need to read out in different units.
export const PAYCHECKS_PER_YEAR = 26
export const rate = (monthly: number) =>
  `${money((monthly * 12) / PAYCHECKS_PER_YEAR)}/paycheck`

// collate marks a group: it takes exactly what its children demand and never competes for
// leftovers. Empty-with-children cannot mean this by itself, because a conduit like net pay
// is also empty with children and must keep passing leftovers down to the catch-all below it.
type Item = { id: string; data: Rate & { collate?: boolean } }
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

export const VarsContext = createContext<Vars>({})

// The two the graph fills in per node, offered alongside the variables table.
export const SYSTEM_VARS = ['$pool', '$auto']

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

// Demands travel upstream, leftovers travel downstream. Assumes no cycles (wouldCycle guards that).
export function computeFlows(items: Item[], links: Link[], vars: Vars = {}): Flows {
  // A node using $pool or $auto can't be resolved until its parent shares out; until then
  // it behaves like an empty node, and its parent fills the edge in during allocate.
  const collated = new Set(items.filter((n) => n.data.collate).map((n) => n.id))
  const derived = new Map(
    items
      .filter((n) => !n.data.collate && usesFlowVars(n.data.amount))
      .map((n) => [n.id, n.data]),
  )
  // A group ignores any amount left on it; its size is whatever its children add up to.
  const set = new Map(
    items.map((n) => [
      n.id,
      derived.has(n.id) || n.data.collate ? null : toMonthly(n.data, vars),
    ]),
  )
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
  const isEmpty = (id: string) =>
    set.get(id) == null && !derived.has(id) && !collated.has(id)

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
    const calc = links.filter((l) => derived.has(l.target))
    for (const l of links) edges.set(l.id, linkFloor(l) * scale)

    // Expressions take what they work out to, not a share of the leftovers.
    const share = rest / (open.length + calc.length || 1)
    let taken = 0
    for (const l of calc) {
      const auto = linkFloor(l) * scale + share
      const value = Math.max(0, toMonthly(derived.get(l.target)!, { ...vars, pool: have, auto }) ?? 0)
      taken += value - edges.get(l.id)!
      edges.set(l.id, value)
    }

    const left = Math.max(0, rest - taken)
    for (const l of open) edges.set(l.id, edges.get(l.id)! + left / open.length)
    unallocated.set(id, open.length ? 0 : left)
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
