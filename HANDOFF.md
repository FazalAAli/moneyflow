# Handoff

Last updated: 2026-09-12 19:09 IST

- The README describes what Money Flow is and what it is not.
- A Nix setup provides the tools needed to work on the project.
- A basic web app was created in the `frontend` folder using Vite's standard React starter.
- The app's packages were installed, including React Flow, the library for drawing the graph.
- The starter's sample content was removed.
- A stream node lives in `frontend/src/nodes/stream.tsx`. The node face shows the label, the rate, what flows through it, and, when it sends money on, what goes out and what is left over.
- `frontend/src/nodes/index.ts` registers the node types with React Flow.
- The flow maths lives in `frontend/src/flow.ts`. It works out what moves along every connection: nodes with an amount take what they need, nodes with an empty amount take whatever is left, and leftovers are split evenly between them. Nodes report what arrives, what goes out, what's left over, and how much they're short.
- Connections that would make a loop are refused.
- A node shows green when nothing comes in, red when nothing goes out, and blue when money passes through.
- A stream's amount is an expression rather than a plain number. It can be arithmetic (`50 * 2`) and it can use two variables: `$pool`, everything the parent sends out, and `$auto`, the share this node would have got if the amount were left empty. An expression takes what it works out to instead of a share of the leftovers, and an expression that doesn't make sense reads as nothing.
- A "Variables" button on the canvas opens a table of named values in `frontend/src/vars.tsx`. Rows can be added, renamed, retyped, and removed, and Save closes the table and reruns the graph. Any amount can then read one as `$name`. The table lives in memory only, so it starts empty on a reload.
- Editing a stream happens in a modal, opened by double-clicking the node, rather than on the node face. The modal holds the name, the amount, and the cadence, and has a Delete button that removes the node and the connections attached to it.
- The modal has a sidebar listing the variables that can be used in an amount, `$pool` and `$auto` first and the table's own names after. Each one is a chip that can be dragged into the amount or clicked to append it. The sidebar scrolls on its own so a long list doesn't stretch the modal.
- The amount field renders those variables as chips while you type, in `frontend/src/expr.tsx`. It is a real text input with the text made transparent and a matching layer behind it painting the chips, so typing, selection, undo and dropping a chip all still behave normally. A name the graph doesn't know paints red instead of blue.
- Rates read per paycheck, twenty-six a year, to match the sheet being modelled. The engine still works in monthly rates throughout and only converts for display.
- A stream can be marked as a group, which makes it take exactly what the streams below it add up to and never a share of the leftovers. A group ignores any amount left on it. Groups can be collapsed, which hides everything below them on the canvas; hiding is only visual, and the maths always runs on the whole graph.
- A "+ Stream" button on the canvas adds a node at the centre of the screen with an empty name, which reads as a grey "Untitled" until it is filled in.
- The app is dark mode only and opens with a small sample graph: a salary that splits into tax, groceries, a collapsed subscriptions group, and savings that takes whatever is left over.
- `frontend/tests/flow.test.ts` covers the flow maths and runs with `npm test`.
- A personal model of the author's own finances is kept in `frontend/src/model.local.ts`, with a check in `frontend/tests/sheet.check.ts` that it reproduces the spreadsheet's per-paycheck figures. Both are ignored by git and never committed.
- The README's building blocks were updated to describe streams.
