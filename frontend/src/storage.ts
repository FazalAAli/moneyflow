import type { Edge } from '@xyflow/react'
import type { Vars } from './flow'
import type { AppNode } from './nodes'

export type Saved = { version: 1; nodes: AppNode[]; edges: Edge[]; vars: Vars }

const KEY = 'moneyflow.graph.v1'

// React Flow writes render state onto the nodes it hands back (measured, selected, dragging)
// and App adds `hidden`/`label` for display. Only these fields are the model.
export const serialize = (nodes: AppNode[], edges: Edge[], vars: Vars): string =>
  JSON.stringify({
    version: 1,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    vars,
  } satisfies Saved)

export function parse(text: string): Saved | null {
  try {
    const v = JSON.parse(text)
    if (v?.version !== 1 || !Array.isArray(v.nodes) || !Array.isArray(v.edges)) return null
    // ponytail: shape check stops at the top level. The only author of these files is the
    // only user, and a bad node renders empty rather than throwing.
    return { version: 1, nodes: v.nodes, edges: v.edges, vars: v.vars ?? {} }
  } catch {
    return null
  }
}

// localStorage throws when site data is blocked, so every touch is guarded.
export function load(): Saved | null {
  try {
    const text = localStorage.getItem(KEY)
    return text ? parse(text) : null
  } catch {
    return null
  }
}

export function save(text: string) {
  try {
    localStorage.setItem(KEY, text)
  } catch {
    /* nothing we can do, and nagging on every keystroke is worse */
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* already gone as far as the user is concerned */
  }
}
