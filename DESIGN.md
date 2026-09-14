# Cinematch design system — Tehran Premiere

## Intent

The interface should feel like a premium native cinema companion: lacquered theatre surfaces, projected lapis light, restrained iOS-like material, and the disciplined information hierarchy of a call sheet. The Tehran Premiere identity remains in its plum, rose, gold, and bilingual typographic character. It must not look like a generic streaming clone, a newspaper, or a neon cyberpunk dashboard.

## Signature

The **marquee rail** is the durable signature: a slim illuminated line that ties together brand, route context, PWA state, install/update actions, and the theme switch. It becomes a top app bar on mobile and a horizontal masthead on larger screens.

The home hero uses one cinematic image with a sharp diagonal projection field. Typography and actions sit in a protected, high-contrast zone; decorative film terminology never replaces product language.

## Color strategy

Full palette with dark and light semantic themes. Dark is the primary, English-first experience and is optimized for evening use; light resembles a clean projection booth in daylight.

### Primitive colors

- Premiere black: `#070811`
- Velvet aubergine: `#24111F`
- Lapis beam: `#5577FF`
- Rose marquee: `#F04D83`
- Celluloid gold: `#D9B66F`
- Projection ivory: `#F5F1E8`
- Carbon ink: `#171827`
- Paper haze: `#E9E4DA`
- Success: `#247D64`
- Danger: `#BA3948`

Runtime components consume semantic and component aliases only. `frontend/src/tokens.css` is the runtime adapter and the sole owner of light/dark theme mappings.

## Typography

- English: the native system UI stack for fast, familiar iOS-like reading.
- Persian display: Estedad for hero titles, route titles, and section statements.
- Persian body: Vazirmatn for interface copy, forms, descriptions, and long reading.
- Utility/data: the active interface stack with tabular numerals for percentages, years, ratings, and progress.

The display scale is compact on mobile and expands sharply on wide screens. Headline line breaks follow Persian grammar. Body measure stays between roughly 45 and 70 characters.

## Layout

Mobile-first app shell:

```text
┌─────────────────────────────┐
│ brand · route    install ◐  │  marquee rail / safe area
├─────────────────────────────┤
│ cinematic thesis + action   │
│                             │
│ task/content                │
│                             │
├─────────────────────────────┤
│ home  concierge  search ... │  thumb dock / safe area
└─────────────────────────────┘
```

Desktop:

```text
┌──────────────────────────────────────────────────────────┐
│ brand     route rail        nav           install  theme │
├──────────────────────────────────────────────────────────┤
│ asymmetric cinematic hero / protected Persian type zone │
├──────────────────────────────────────────────────────────┤
│ editorial-width content with poster/contact-sheet rhythm │
└──────────────────────────────────────────────────────────┘
```

Containers are broad and cinematic, not a nested-card dashboard. Cards are reserved for actual film records, bounded form stages, dialogs, and status surfaces.

## Components

Phosphor Duotone is the canonical interface icon family. Icons follow the runtime `--icon-xs` through `--icon-lg` scale; controls own icon geometry by role so text size never accidentally shrinks or enlarges their symbols. Directional arrows continue to follow the RTL reading flow.

- App masthead: sticky, translucent only where contrast remains reliable, safe-area aware.
- Mobile dock: maximum five destinations, icon plus visible label, current route clearly selected.
- Hero: route-specific title and one clear primary action; compact variant for operating screens.
- Film card: portrait artwork, title, year/genres, reason/match, details, and separate rating action.
- Forms: visible labels, owned validation, persistent field geometry, clear selected states, and one primary action per stage.
- Dialogs: native dialog semantics with explicit title, close action, focus restoration, Escape, and non-destructive default focus.
- Status: one shared inline/live-region language for offline, update, install, loading, errors, and success.
- Watch tracker: broad account workspace with a 53-week, Sunday-aligned activity grid; five semantic green levels encode zero through high daily viewing without replacing textual totals.
- Library row: artwork, media badge, title, series progress/remaining episodes, and task-specific actions. Watchlist, currently watching, and completed sections share this single row owner.

The tracker is the one deliberately data-dense surface. Its contribution grid borrows the familiar GitHub temporal grammar while using Cinematch tokens, Persian labels, RTL surrounding flow, and an LTR chronological grid.

## Motion

One orchestrated projection reveal on initial route entry, 220–420ms with transform/opacity only. State changes use 150–240ms transitions. No looping decoration. `prefers-reduced-motion` removes all non-essential movement.

## Theme behavior

Initial theme follows the OS. A visible labeled switch cycles light/dark and persists the explicit choice in versioned local storage. Both schemes set `color-scheme`; PWA theme-color metadata updates at runtime.

## Accessibility and localization

WCAG 2.2 AA, minimum 44px coarse-pointer targets, visible focus, logical DOM order, semantic controls, no hover-only information, LTR/RTL geometry, correct mixed-direction content, and 200% zoom resilience.

## Anti-patterns

- No reuse of the former paper grid, left sidebar, pomegranate/turquoise identity, or arch/projector illustration system.
- No generic streaming-service carousel clone.
- No glass-card stacks, excessive glow, poster-wall clutter, emoji icons, or decorative English film jargon.
- No hardcoded theme colors inside feature components.
