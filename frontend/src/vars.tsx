import { useRef, useState } from 'react'
import type { Vars } from './flow'

type Row = [name: string, value: string]

export function VarsTable({ vars, onSave }: { vars: Vars; onSave: (v: Vars) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [rows, setRows] = useState<Row[]>([])

  function open() {
    setRows(Object.entries(vars).map(([name, value]) => [name, String(value)]))
    dialog.current?.showModal()
  }

  function save() {
    const named = rows.filter(([name]) => name.trim())
    onSave(Object.fromEntries(named.map(([name, value]) => [name.trim(), Number(value) || 0])))
    dialog.current?.close()
  }

  const edit = (i: number, row: Row) => setRows(rows.map((r, j) => (j === i ? row : r)))

  return (
    <>
      <button onClick={open}>Variables</button>
      <dialog ref={dialog} className="modal">
        <h2 className="modal-title">Variables</h2>
        <div className="modal-body">
          <div className="vars-hint">
            Use one in any amount as <code>$name</code>.
          </div>
          {rows.map(([name, value], i) => (
            <div key={i} className="vars-row">
              <input
                placeholder="name"
                value={name}
                onChange={(e) => edit(i, [e.target.value, value])}
              />
              <input type="number" value={value} onChange={(e) => edit(i, [name, e.target.value])} />
              <button
                className="icon"
                title="Remove"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button className="ghost" onClick={() => setRows([...rows, ['', '']])}>
            + Variable
          </button>
        </div>
        <div className="modal-actions">
          <button className="primary" onClick={save}>
            Save
          </button>
        </div>
      </dialog>
    </>
  )
}
