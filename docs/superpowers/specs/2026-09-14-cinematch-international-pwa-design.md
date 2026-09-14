# Cinematch International PWA Design

## Product direction

Cinematch is an English-first, dark cinematic PWA for movie and series discovery, recommendations, watchlists, ratings, and persisted viewing progress. Persian remains a complete optional locale and switches the document to RTL. The visual language combines midnight navy, plum, indigo, restrained rose and gold, ivory text, and selective glass materials for navigation, search, sheets, and overlays.

## Fixed contracts

- Hash routes, browser history, deep links, originating-list state, and protected-route `next` redirects remain authoritative.
- Authentication remains an HttpOnly, SameSite=Strict cookie with origin validation for mutations.
- Public catalog GETs may use the bounded service-worker cache. Auth, ratings, user data, and recommendations are never runtime-cached.
- Existing ratings, library entries, viewing activity, and movie/series media types remain the source of truth.
- Discover and recommendation media selections are represented in hash query state.

## Experience contract

Mobile uses safe-area-aware sticky top chrome, a five-destination glass tab bar, and bottom-sheet task flows. Desktop uses the same product hierarchy in a broad editorial frame. Controls meet 44px touch targets, preserve visible focus, restore focus after overlays, and honor reduced motion. The activity heatmap is backed by persisted movie and episode events and remains usable by pointer, touch, keyboard, and assistive technology.

Series details load existing progress before any mutation and expose status, current season and episode, watched and remaining episodes, and completion percentage. “Mark next episode watched” starts an absent entry, moves a watchlist entry to watching, advances existing progress, and completes at the catalog total. Requests carry a persisted idempotency key so retries do not double-advance. Exact season rollover is intentionally not inferred without per-season episode counts.
