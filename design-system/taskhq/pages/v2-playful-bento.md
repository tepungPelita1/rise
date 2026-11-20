# Rise v2 — "Playful Bento" (overrides MASTER.md)

Synthesised from 6 references the user shared (2026-11-20):

| Reference | What we take |
|-----------|--------------|
| Artistry kids academy | Pastel cards (green / lilac / lime), bold sans + *italic serif* headline, pill tags, round ↗ arrow buttons, black outline pill nav |
| Illustratio | Warm cream background, black pill CTA, floating stickers (star, arcs) |
| Pantom | Grid of `+` glyphs in shades of grey → our "3 slots for today" indicator; serif italic captions |
| Timeline | Vertical step timeline (✓ done, clock = current, grey = later) → goal steps and Done history |
| Zentra | Huge page titles, huge numbers, black active pill in the top nav, soft white cards on grey |
| Activity cards | GitHub contribution heatmap, summary sentence with inline badges, thin progress bars |

## Rules
- **Layout:** top bar with centered pill nav (no sidebar). Content max 1120px. Bento grid with 12 columns, 16px gap.
- **Cards:** radius 24px, white on warm off-white, 1px border, almost no shadow. Feature cards use pastel fills.
- **Type:** Geist (UI, 400–700) + Instrument Serif *italic* for one accent phrase per heading. Titles 48–64px, tight tracking (-0.03em).
- **Colour per area** (pastel fill + dark ink text, AA contrast):
  Study = lilac `#CDBDF7`, Build = green `#3DDC84`, Life Admin = yellow `#FFE47A`, Self = pink `#F8C2E4`.
  Lime `#DDF5B3` = focus / highlight. Black `#121212` = primary action.
- **Buttons:** pills. Primary = black fill. Card action = 40px round outline button with ↗.
- **Heatmap:** 26 weeks × 7 days, GitHub greens, Less → More legend.
- **Dark mode:** the same layout with near-black surfaces; pastel cards keep their dark ink text.
- **Motion:** hover lift (translateY -2px) at 200ms; respect reduced motion.
