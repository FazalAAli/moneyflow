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
import { FlowsContext, computeFlows, money, wouldCycle, type Vars } from './flow'
import { nodeTypes, type AppNode } from './nodes'
import { VarsTable } from './vars'

const initialNodes: AppNode[] = [
  {
    id: 'salary',
    type: 'stream',
    position: { x: 0, y: 0 },
    data: { label: 'Salary', amount: '2600', every: 2, unit: 'week' },
  },
  {
    id: 'groceries',
    type: 'stream',
    position: { x: 350, y: 0 },
    data: { label: 'Groceries', amount: '100', every: 1, unit: 'week' },
  },
  {
    id: 'savings',
    type: 'stream',
    position: { x: 350, y: 150 },
    data: { label: 'Savings', amount: '', every: 1, unit: 'month' },
  },
]

function AddStream() {
  const { addNodes, screenToFlowPosition } = useReactFlow<AppNode>()

  function add() {
    const label = prompt('Name')
    if (!label) return
    addNodes({
      id: crypto.randomUUID(),
      type: 'stream',
      position: screenToFlowPosition({ x: innerWidth / 2, y: innerHeight / 2 }),
      data: { label, amount: '', every: 1, unit: 'month' },
    })
  }

  return <button onClick={add}>+ Stream</button>
}

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [vars, setVars] = useState<Vars>({})
  const flows = useMemo(() => computeFlows(nodes, edges, vars), [nodes, edges, vars])
  const labelled = useMemo(
    () => edges.map((e) => ({ ...e, label: `${money(flows.edges.get(e.id) ?? 0)}/month` })),
    [edges, flows],
  )

  return (
    <FlowsContext value={flows}>
      <ReactFlow
        nodes={nodes}
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
    </FlowsContext>
  )
}
