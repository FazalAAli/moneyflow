import assert from 'node:assert/strict'
import { parse, serialize } from '../src/storage.ts'

const nodes = [
  {
    id: 'salary',
    type: 'stream' as const,
    position: { x: 0, y: 140 },
    data: { label: 'Salary', amount: '2600', every: 2, unit: 'week' as const },
  },
  {
    id: 'subs',
    type: 'stream' as const,
    position: { x: 380, y: 240 },
    data: {
      label: 'Subs',
      amount: '',
      every: 1,
      unit: 'month' as const,
      collate: true,
      collapsed: true,
    },
  },
]
const edges = [{ id: 'salary-subs', source: 'salary', target: 'subs' }]
const vars = { tax_rate: 0.2 }

{
  const back = parse(serialize(nodes, edges, vars))!
  assert.deepEqual(back.nodes, nodes)
  assert.deepEqual(back.edges, edges)
  assert.deepEqual(back.vars, vars)
}

{
  // render-only state React Flow and App bolt on must not survive a save
  const dirty = nodes.map((n) => ({ ...n, hidden: true, selected: true, measured: { width: 10 } }))
  const dirtyEdges = edges.map((e) => ({ ...e, label: '$100 / mo', hidden: true }))
  const back = parse(serialize(dirty, dirtyEdges, vars))!
  assert.deepEqual(back.nodes, nodes)
  assert.deepEqual(back.edges, edges)
}

for (const bad of ['', '{', 'null', '[]', '{"version":2,"nodes":[],"edges":[]}', '{"version":1}'])
  assert.equal(parse(bad), null, bad)

// vars are optional, everything else is not
assert.deepEqual(parse('{"version":1,"nodes":[],"edges":[]}')!.vars, {})

console.log('storage ok')
