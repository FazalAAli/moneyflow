import assert from 'node:assert/strict'
import { computeFlows, wouldCycle, type Rate } from '../src/flow.ts'

const node = (id: string, amount: number | null, every = 1, unit: Rate['unit'] = 'month') => ({
  id,
  data: { amount, every, unit },
})
const link = (source: string, target: string) => ({ id: `${source}-${target}`, source, target })
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

// Set expense takes its demand, empty node takes the rest.
{
  const f = computeFlows(
    [node('salary', 2600, 2, 'week'), node('groceries', 100, 1, 'week'), node('rest', null)],
    [link('salary', 'groceries'), link('salary', 'rest')],
  )
  close(f.edges.get('salary-groceries')!, (100 * 52) / 12)
  close(f.edges.get('salary-rest')!, (2600 * 26) / 12 - (100 * 52) / 12)
  assert.equal(f.nodes.get('salary')!.unallocated, 0)
}

// Two empty nodes split the leftover evenly; nothing connected means it's all unallocated.
{
  const f = computeFlows(
    [node('s', 1000), node('a', null), node('b', null), node('lonely', 500)],
    [link('s', 'a'), link('s', 'b')],
  )
  assert.equal(f.edges.get('s-a'), 500)
  assert.equal(f.edges.get('s-b'), 500)
  assert.equal(f.nodes.get('lonely')!.flow, 500)
}

// Asking for more than arrives: shortfall.
{
  const f = computeFlows([node('s', 100), node('rent', 150)], [link('s', 'rent')])
  assert.equal(f.edges.get('s-rent'), 100)
  assert.equal(f.nodes.get('rent')!.short, 50)
}

// An empty pass-through takes everything and keeps what its children don't need.
{
  const f = computeFlows(
    [node('salary', 5000), node('savings', null), node('groceries', 400)],
    [link('salary', 'savings'), link('savings', 'groceries')],
  )
  assert.equal(f.nodes.get('savings')!.flow, 5000)
  assert.equal(f.nodes.get('savings')!.unallocated, 4600)
  assert.equal(f.nodes.get('savings')!.out, 400)
  assert.equal(f.nodes.get('salary')!.unallocated, 0)
}

// Children's needs pull up through an empty node before siblings share the rest.
{
  const f = computeFlows(
    [node('s', 5000), node('checking', null), node('rent', 1000), node('food', 100), node('x', null)],
    [link('s', 'checking'), link('checking', 'rent'), link('checking', 'food'), link('s', 'x')],
  )
  assert.equal(f.nodes.get('checking')!.flow, 3050)
  assert.equal(f.nodes.get('checking')!.unallocated, 1950)
  assert.equal(f.nodes.get('x')!.flow, 1950)
}

// Put X after Checking and it gets what's left once the bills are paid.
{
  const f = computeFlows(
    [node('s', 5000), node('checking', null), node('rent', 1000), node('food', 100), node('x', null)],
    [link('s', 'checking'), link('checking', 'rent'), link('checking', 'food'), link('checking', 'x')],
  )
  assert.equal(f.nodes.get('x')!.flow, 3900)
  assert.equal(f.nodes.get('checking')!.unallocated, 0)
}

// Not enough to cover what's needed downstream of an empty node: everyone gets the same fraction.
{
  const f = computeFlows(
    [node('s', 550), node('checking', null), node('rent', 1000), node('food', 100)],
    [link('s', 'checking'), link('checking', 'rent'), link('checking', 'food')],
  )
  assert.equal(f.nodes.get('rent')!.short, 500)
  assert.equal(f.nodes.get('food')!.short, 50)
}

// Loops are refused.
assert.equal(wouldCycle([link('a', 'b'), link('b', 'c')], 'c', 'a'), true)
assert.equal(wouldCycle([link('a', 'b')], 'a', 'c'), false)
assert.equal(wouldCycle([], 'a', 'a'), true)

console.log('flow tests passed')
