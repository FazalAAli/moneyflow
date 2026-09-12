import { Handle, Position, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import { use, useRef } from 'react'
import { ExpressionInput } from '../expr'
import { FlowsContext, SYSTEM_VARS, VarsContext, rate, type Rate, type Unit } from '../flow'

export type StreamNode = Node<
  { label: string; collate?: boolean; collapsed?: boolean } & Rate,
  'stream'
>

export function StreamNodeView({ id, data }: NodeProps<StreamNode>) {
  const { updateNodeData, deleteElements, getEdges } = useReactFlow<StreamNode>()
  const dialog = useRef<HTMLDialogElement>(null)
  const vars = use(VarsContext)
  const f = use(FlowsContext).nodes.get(id)
  if (!f) return null

  const role = !f.hasIn ? 'income' : f.hasOut ? 'pass' : 'expense'
  const names = Object.keys(vars)

  // ponytail: dropping text on an <input> inserts it at the caret natively, so no drop handler.
  const Token = ({ token }: { token: string }) => (
    <button
      type="button"
      className="chip"
      draggable
      title="Drag into the amount, or click to append"
      onDragStart={(e) => e.dataTransfer.setData('text/plain', token)}
      onClick={() => updateNodeData(id, { amount: data.amount + token })}
    >
      {token}
    </button>
  )

  return (
    <div className={`node node-${role}`} onDoubleClick={() => dialog.current?.showModal()}>
      <Handle type="target" position={Position.Left} />
      <div className={data.label ? 'node-label' : 'node-label empty'}>
        {data.label || 'Untitled'}
      </div>
      <div className="node-detail node-rate" title={data.amount}>
        {data.collate ? (
          <button
            className="node-toggle nodrag"
            onClick={(e) => {
              e.stopPropagation()
              updateNodeData(id, { collapsed: !data.collapsed })
            }}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {data.collapsed ? '▸' : '▾'} {getEdges().filter((e) => e.source === id).length} streams
          </button>
        ) : (
          <>
            {data.amount || 'auto'} every {data.every} {data.unit}
            {data.every === 1 ? '' : 's'}
          </>
        )}
      </div>
      <div className="node-flow">{rate(f.flow)}</div>
      {f.short > 0 && <div className="node-short">{rate(f.short)} short</div>}
      {f.hasOut && (
        <div className="node-detail">
          {rate(f.out)} out · {rate(f.unallocated)} excess
        </div>
      )}
      <Handle type="source" position={Position.Right} />

      {/* ponytail: edits apply live, so the dialog needs no draft state or Cancel */}
      <dialog ref={dialog} className="modal wide nodrag" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Stream</h2>
        <div className="modal-split">
          <aside className="var-bar">
            <div className="var-group">System</div>
            {SYSTEM_VARS.map((t) => (
              <Token key={t} token={t} />
            ))}
            <div className="var-group">Variables</div>
            {names.length === 0 && <div className="var-empty">None yet.</div>}
            {names.map((name) => (
              <Token key={name} token={`$${name}`} />
            ))}
          </aside>
          <div className="modal-body">
            <label className="field">
              <span>Name</span>
              <input
                placeholder="Untitled"
                value={data.label}
                onChange={(e) => updateNodeData(id, { label: e.target.value })}
              />
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={!!data.collate}
                onChange={(e) => updateNodeData(id, { collate: e.target.checked })}
              />
              <span>Group — adds up whatever feeds off it</span>
            </label>
            {!data.collate && (
              <>
                <label className="field">
                  <span>Amount</span>
                  <ExpressionInput
                    value={data.amount}
                    onChange={(amount) => updateNodeData(id, { amount })}
                  />
                  <small className="field-hint">
                    A number or expression. Drag a variable in from the left.
                  </small>
                </label>
                <div className="field">
                  <span>Every</span>
                  <div className="field-row">
                    <input
                      type="number"
                      min="1"
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
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal-actions">
          {/* deleteElements takes the connected edges with it, so no orphans are left behind. */}
          <button className="danger" onClick={() => deleteElements({ nodes: [{ id }] })}>
            Delete
          </button>
          <button className="primary" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </div>
  )
}
