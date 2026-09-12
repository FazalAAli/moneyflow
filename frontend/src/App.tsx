import {
  Panel,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo, useState } from 'react'
import { FlowsContext, VarsContext, computeFlows, rate, wouldCycle, type Vars } from './flow'
import { nodeTypes, type AppNode } from './nodes'
import { VarsTable } from './vars'

const initialVars: Vars = { tax_rate: 0.2 }

const initialNodes: AppNode[] = [
  {
    id: 'salary',
    type: 'stream',
    position: { x: 0, y: 140 },
    data: { label: 'Salary', amount: '2600', every: 2, unit: 'week' },
  },
  {
    id: 'tax',
    type: 'stream',
    position: { x: 380, y: -40 },
    data: { label: 'Tax', amount: '$pool * $tax_rate', every: 1, unit: 'month' },
  },
  {
    id: 'groceries',
    type: 'stream',
    position: { x: 380, y: 100 },
    data: { label: 'Groceries', amount: '100', every: 1, unit: 'week' },
  },
  {
    id: 'subs',
    type: 'stream',
    position: { x: 380, y: 240 },
    data: {
      label: 'Subscriptions',
      amount: '',
      every: 1,
      unit: 'month',
      collate: true,
      collapsed: true,
    },
  },
  {
    id: 'music',
    type: 'stream',
    position: { x: 760, y: 200 },
    data: { label: 'Music', amount: '10', every: 1, unit: 'month' },
  },
  {
    id: 'streaming',
    type: 'stream',
    position: { x: 760, y: 320 },
    data: { label: 'Streaming', amount: '15', every: 1, unit: 'month' },
  },
  {
    id: 'savings',
    type: 'stream',
    position: { x: 380, y: 400 },
    data: { label: 'Savings', amount: '', every: 1, unit: 'month' },
  },
]

const edge = (source: string, target: string) => ({ id: `${source}-${target}`, source, target })

const initialEdges: Edge[] = [
  ...['tax', 'groceries', 'subs', 'savings'].map((t) => edge('salary', t)),
  ...['music', 'streaming'].map((t) => edge('subs', t)),
]

// ponytail: collapsing is purely visual. computeFlows always runs on the full graph, so a
// hidden stream still counts toward its group's total and toward everything upstream.
function hiddenIds(nodes: AppNode[], edges: Edge[]): Set<string> {
  const children = new Map<string, string[]>()
  for (const e of edges) children.set(e.source, [...(children.get(e.source) ?? []), e.target])

  const hidden = new Set<string>()
  const stack = nodes.filter((n) => n.data.collapsed).flatMap((n) => children.get(n.id) ?? [])
  while (stack.length) {
    const id = stack.pop()!
    if (hidden.has(id)) continue
    hidden.add(id)
    stack.push(...(children.get(id) ?? []))
  }
  return hidden
}

function AddStream() {
  const { addNodes, screenToFlowPosition } = useReactFlow<AppNode>()

  const add = () =>
    addNodes({
      id: crypto.randomUUID(),
      type: 'stream',
      position: screenToFlowPosition({ x: innerWidth / 2, y: innerHeight / 2 }),
      data: { label: '', amount: '', every: 1, unit: 'month' },
    })

  return <button onClick={add}>+ Stream</button>
}

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const [vars, setVars] = useState<Vars>(initialVars)
  const flows = useMemo(() => computeFlows(nodes, edges, vars), [nodes, edges, vars])
  const hidden = useMemo(() => hiddenIds(nodes, edges), [nodes, edges])
  const shown = useMemo(
    () => nodes.map((n) => (hidden.has(n.id) ? { ...n, hidden: true } : n)),
    [nodes, hidden],
  )
  const labelled = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        label: rate(flows.edges.get(e.id) ?? 0),
        hidden: hidden.has(e.source) || hidden.has(e.target),
      })),
    [edges, flows, hidden],
  )

  return (
    <FlowsContext value={flows}>
      <VarsContext value={vars}>
        <ReactFlow
          nodes={shown}
          edges={labelled}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(c) => setEdges((es) => addEdge(c, es))}
          isValidConnection={(c) => !wouldCycle(edges, c.source, c.target)}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
        >
          <Panel position="top-left">
            <AddStream />
            <VarsTable vars={vars} onSave={setVars} />
          </Panel>
        </ReactFlow>
      </VarsContext>
    </FlowsContext>
  )
}
