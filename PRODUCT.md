# Cinematch product context

## Product

Cinematch (سینمچ) is a Persian-first, installable film recommendation PWA. It helps someone move from “I want to watch something tonight” to a small, explainable set of films without browsing an endless catalogue.

## Audience and scene

- Persian-speaking film viewers choosing alone or with friends, usually on a phone in the evening.
- People who want international and Iranian cinema in one coherent catalogue.
- Returning members whose ratings should improve their recommendations over time.

## Primary job

Help the viewer choose a film for the current mood quickly, while keeping enough context and control to trust the result.

## Core journeys

1. Open the app and request a mood-led recommendation.
2. Browse or search the catalogue and inspect film details.
3. Create an account, rate three films, and receive personal recommendations.
4. Revisit ratings, change recommendation mode, and refine taste over time.
5. Install the PWA, continue browsing public cached content offline, and update when a new version is ready.

## Product truths to preserve

- Public: home, discovery, film detail, and similar films.
- Authenticated: mood concierge, onboarding, ratings, and personal recommendations.
- Recommendation reasons and match percentages remain visible and understandable.
- Persian is the primary locale and interface direction is RTL; English film summaries retain LTR direction.
- Authentication remains cookie-based and private endpoints are never cached by the service worker.
- TMDB and MovieLens attribution and licence caveats remain visible.
- Existing API routes, query parameters, hash navigation, browser back behavior, and testable labels remain compatible.

## Platform

Web, responsive from 320px upward, with an installable standalone PWA experience. Priority contexts are small mobile screens, touch, one-handed use, and evening viewing; desktop remains a first-class browsing surface.

## Success criteria

- The primary “recommend something tonight” action is obvious within the first viewport.
- Forms are easy to complete one-handed and communicate progress, constraints, loading, errors, and completion.
- The UI works in light and dark themes, defaults to the system preference, and persists the viewer’s choice.
- App-shell controls respect safe areas, 44px touch targets, keyboard navigation, reduced motion, and WCAG 2.2 AA contrast.
- Route-level code splitting and existing caching boundaries remain intact.

## Assumptions

The brief explicitly authorizes a full visual replacement and creative direction. Product behavior, factual copy, data sources, and security boundaries are treated as fixed unless code evidence requires a correction.
