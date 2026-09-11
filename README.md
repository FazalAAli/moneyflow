# Money Flow

*Working title.* A personal tool for modeling where my money goes as a graph I can see and rewire. It isn't built for anyone else.

## Why

I already know how my money moves. The trouble is that the knowledge sits in a spreadsheet, where I can't see it.

In a spreadsheet, the structure of my finances (the paycheck splits into these things, and what's left splits into those) lives in cell references. I can see the amounts but not the shape. When I want to change the shape, I can't just rewire it. I have to rewrite formulas and hope I caught every dependent cell. The part I care about most, the architecture of where money goes, is the one part the tool won't show me.

Existing tools get this backwards. A Sankey diagram is a picture of numbers I worked out somewhere else. A budget app sorts money into categories after it's already spent. Neither one holds the model, and the diagram is only ever an output.

**Here, the diagram is the model.**

## What it is

Money Flow is a canvas where I lay out my money as a graph and wire it together. Income comes in on the left, gets divided by rules I define, and ends up in expenses and investments on the right. Every number on every connection comes from how things are wired. I never type an amount twice, and I never type an amount the graph could have worked out itself.

To restructure my finances, I drag a connection somewhere else.

## Core idea

> I declare intent. The tool derives the amounts.

With a Sankey tool I'd say "$1,200 goes here." Here I say "a fifth of what arrives goes here," and the graph works out what that means. It works it out again automatically whenever something upstream changes.

## Building blocks

| Piece | Role |
|---|---|
| **Source** | Produces money. It knows how much and how often: a salary every two weeks, a bonus each quarter, a dividend that lands irregularly. Sources are the only place I enter raw numbers. |
| **Splitter** | Divides what arrives and passes it on. It holds nothing and keeps nothing; money just moves through. All the logic lives here: percentages, fixed carve-outs, and any other rules I define. |
| **Sink** | Receives money and stops it. Rent, groceries, a brokerage account. For now a sink is simple: it takes money in and reports how much reached it. |
| **Connection** | Carries a rate. It's an ongoing "this much per month flows along here," not a transaction or a dated event. |

## What it should let me do in seconds

- See the actual shape of my money, not a summary of it.
- Change one thing upstream and watch every downstream number move.
- Answer *"If I raise my retirement contributions, what gets squeezed?"* by editing one splitter.
- Answer *"Where does a raise actually land?"* by changing one source.
- Notice flows I forgot I'd set up, because they're sitting right there on the canvas.
- Spot money going somewhere I didn't intend, which a table of categories would never make obvious.

## What this is not

This list matters more than the feature list. Adding any of these would quietly turn Money Flow into a different product.

- **Not a transaction tracker.** It never connects to my bank and doesn't know what I actually spent. It models how I've arranged things, not what happened.
- **Not a budget enforcer.** No alerts, no limits, no warnings that I overspent on restaurants.
- **Not a projection tool.** It doesn't step forward through time, compound growth, or tell me when I'll hit a number. That's a different tool, and it already exists.
- **Not an accounting system.** No balances, no reconciliation, no ledger.
- **Not for anyone else.** No accounts, no sharing, no onboarding, no explaining what a node is.

## Design principles

- **The canvas is the document.** Nothing important hides behind a settings panel or a modal. If it affects the numbers, it's visible on the graph.
- **Rewiring is cheap.** Trying a different arrangement should take seconds and cost nothing. Experimenting is the main use, not an advanced feature.
- **No number is entered twice.** If the graph can derive a number, I don't type it. Any place I'm forced to type a redundant number is a gap in the model.
- **Structure over precision.** Getting the shape right matters more than getting amounts exact to the dollar. A rough model with the right architecture beats a precise one with the wrong architecture.

## v1

v1 is done when:

1. I can rebuild my current spreadsheet on the canvas, end to end, and it reads more clearly than the spreadsheet does.
2. I can change one source amount, and every affected number updates without me touching anything else.

If that works, everything after it is refinement.
