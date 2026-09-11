import { Handle, Position, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import { use } from 'react'
import { FlowsContext, money, type Rate, type Unit } from '../flow'

export type StreamNode = Node<{ label: string } & Rate, 'stream'>

export function StreamNodeView({ id, data }: NodeProps<StreamNode>) {
  const { updateNodeData } = useReactFlow<StreamNode>()
  const f = use(FlowsContext).nodes.get(id)
  if (!f) return null

  const role = !f.hasIn ? 'income' : f.hasOut ? 'pass' : 'expense'

  return (
    <div className={`node node-${role}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-label">{data.label}</div>
      <div className="node-inputs nodrag">
        <input
          placeholder="auto"
          title="A number, or an expression using $pool (all the parent sends out) and $auto (the share this node would get if left empty)"
          value={data.amount}
          onChange={(e) => updateNodeData(id, { amount: e.target.value })}
        />
        every
        <input
          type="number"
          min="1"
          className="node-every"
          value={data.every || ''}
          onChange={(e) => updateNodeData(id, { every: Number(e.target.value) })}
        />
        <select
          value={data.unit}
          onChange={(e) => updateNodeData(id, { unit: e.target.value as Unit })}
        >
          <option value="week">week</option>
          <option value="month">month</option>
          <option value="year">year</option>
        </select>
      </div>
      <div className="node-flow">{money(f.flow)}/month</div>
      {f.short > 0 && <div className="node-short">{money(f.short)}/month short</div>}
      {f.hasOut && (
        <div className="node-detail">
          {money(f.out)}/month out · {money(f.unallocated)}/month excess
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
