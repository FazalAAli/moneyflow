import { use, useRef } from 'react'
import { SYSTEM_VARS, VarsContext } from './flow'

// Odd indices of the split are the captured tokens.
const TOKEN = /(\$[A-Za-z_]\w*)/g

// ponytail: a real <input> with transparent text, and a mirror layer behind it painting the
// chips. Caret, selection, undo and native text-drop all keep working; contenteditable would
// have cost all four. The mirror must match the input's font and padding exactly or it drifts.
export function ExpressionInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const ink = useRef<HTMLDivElement>(null)
  const vars = use(VarsContext)
  const known = (token: string) => SYSTEM_VARS.includes(token) || token.slice(1) in vars

  return (
    <div className="expr">
      <div className="expr-ink" ref={ink} aria-hidden="true">
        {value.split(TOKEN).map((part, i) =>
          i % 2 ? (
            <mark key={i} className={known(part) ? 'tok' : 'tok unknown'}>
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </div>
      <input
        className="expr-input"
        placeholder="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => ink.current?.scrollTo({ left: e.currentTarget.scrollLeft })}
      />
    </div>
  )
}
