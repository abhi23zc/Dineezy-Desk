# Pure Black & Zinc — Design System

## Personality

Ultra-minimal, professional, and sleek. Inspired by high-end developer tools like Vercel and Linear. Content first, zero color distraction. Dark mode uses pure OLED-like blacks for maximum contrast and an extremely premium feel.

---

## Color Palette

### Brand — Zinc & Black

The primary accent is a neutral dark tone. We replace the slightly blue-tinted "charcoal" with a pure, neutral black and zinc palette. 

| Name | Hex |
|---|---|
| **Black primary** | `#09090B` |
| Zinc dark | `#18181B` |
| Zinc border | `#27272A` |
| Zinc mid | `#A1A1AA` |
| Pure white | `#FFFFFF` |

---

### Light Mode — Backgrounds & Text

| Name | Hex | Where it goes |
|---|---|---|
| White | `#FFFFFF` | Cards, sidebar, topbar |
| Page background | `#FAFAFA` | The main page behind all cards |
| Surface secondary | `#F4F4F5` | Pressed states, secondary areas |
| Divider | `#E4E4E7` | Borders between sections |
| Muted text | `#A1A1AA` | Placeholders, captions, tiny labels |
| Secondary text | `#52525B` | Supporting labels, metadata |
| Body / Heading text| `#09090B` | Task names, descriptions, page titles |

---

### Dark Mode — Backgrounds & Text

Using true deep blacks rather than washed-out grays provides the most professional, high-end appearance.

| Name | Hex | Where it goes |
|---|---|---|
| Page background | `#000000` | Deepest level — pure black behind everything |
| Surface (sidebar, topbar) | `#09090B` | Sidebar, topbar, panels |
| Card background | `#0A0A0A` | All cards, modules, modals |
| Raised surface | `#18181B` | Hover states, module headers |
| Primary text | `#FAFAFA` | Headings, task names |
| Secondary text | `#A1A1AA` | Labels, metadata |
| Divider / Borders | `#27272A` | Default borders and structural dividers |

---

### Status & Priority Colors

Status colors are muted to fit the minimal aesthetic.

| Purpose | Background (Light) | Text (Light) | Background (Dark) | Text (Dark) |
|---|---|---|---|---|
| Done / Success | `#ECFDF5` | `#065F46` | `rgba(16,185,129,0.15)` | `#34D399` |
| Medium / Warning | `#FFFBEB` | `#92400E` | `rgba(245,158,11,0.15)` | `#FBBF24` |
| High / Danger | `#FEF2F2` | `#991B1B` | `rgba(239,68,68,0.15)` | `#F87171` |
| In progress | `#F4F4F5` | `#09090B` | `#18181B` | `#FAFAFA` |
| To do / Neutral | `#FFFFFF` | `#52525B` | `#000000` | `#A1A1AA` |

---

### Team Avatar Colors

Muted, elegant tones for avatars.

| Role | Background (Light) | Text (Light) | Background (Dark) | Text (Dark) |
|---|---|---|---|---|
| 1st member | `#F4F4F5` | `#09090B` | `#18181B` | `#FAFAFA` |
| 2nd member | `#ECFDF5` | `#065F46` | `rgba(16,185,129,0.15)` | `#34D399` |
| 3rd member | `#FEF2F2` | `#991B1B` | `rgba(239,68,68,0.15)` | `#F87171` |
| 4th member | `#FFFBEB` | `#92400E` | `rgba(245,158,11,0.15)` | `#FBBF24` |
| 5th member | `#EEF2FF` | `#3730A3` | `rgba(99,102,241,0.15)`| `#818CF8` |

---

## Typography

**Font:** Inter — weights 400, 500, and optionally 600 for prominent headers.

| Role | Size | Weight | Color (light) |
|---|---|---|---|
| Page heading | 20px | 600 | `#09090B` |
| Section heading | 14px | 500 | `#09090B` |
| Body / task text | 13px | 400 | `#09090B` |
| Label / meta | 12px | 400 | `#52525B` |
| Small caption | 11px | 400 | `#A1A1AA` |

---

## Surfaces & Depth

- **Page** sits at the back. Light: `#FAFAFA`. Dark: `#000000`.
- **Cards and modules** use a 1px border instead of heavy shadows for definition.
- **Borders** are solid. Light: `#E4E4E7`. Dark: `#27272A`.
- **Corner rounding** is subtle — 8px for cards/modules, 6px for buttons/inputs, 4px for badges.

---

## Layout

Three panels side by side:

```
[ Sidebar 220px ] [ Main content — fluid ] [ Team panel 220px ]
```

A topbar runs across the full top at 56px tall.

---

## Key UI Decisions

**Buttons** come in three types. Primary is solid Black (`#09090B` / `#FAFAFA`) with white/black text. Ghost is transparent.

**Task rows** have minimal padding, feeling like a dense, highly scannable list. Hovering adds a very faint tint (`#F4F4F5` in light, `#18181B` in dark).

**Icons** are clean, outline style.
