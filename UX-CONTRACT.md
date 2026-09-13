# Cinematch UX contract

## Navigation

- Hash routes and browser history remain authoritative.
- Browser back returns to the exact originating list/query when opening film details.
- Protected routes redirect to authentication and preserve the intended destination.
- The account action opens the protected watch tracker; logout remains a distinct, explicitly labeled action.
- Route change moves focus to the main content and scrolls to the top.

## Async state

- Every remote view has stable loading, success, empty/no-results, and error states.
- Busy actions prevent duplicate submission without changing button dimensions.
- Errors stay close to the relevant task and preserve entered values.

## Forms

- Labels remain visible; placeholders are examples only.
- Mood and genre limits are announced and enforced.
- Onboarding requires exactly three rated films unless the viewer explicitly skips.
- Authentication fields retain useful autocomplete semantics and passwords are masked by default.

## Feedback

- Success and non-field failures use the shared live toast region.
- Field-level validation is associated with the field and announced.
- Offline, update, install, and iOS install guidance use a shared PWA status surface.

## Watch tracker

- A rating means the viewer watched that film and creates one viewing unit only on the first completion.
- Library status is one of watchlist, watching, or completed; one user has at most one entry per title.
- Series progress stores current season, current episode, and the absolute number of watched episodes. Remaining episodes are derived from catalog totals and never allowed below zero.
- Moving progress forward adds only the positive episode delta to that day's activity. Correcting progress backward does not rewrite historical activity.
- The yearly activity graph starts on Sunday, ends today, and maps daily units to five intensity levels. Textual totals and streaks remain available independently of color.
- Day boundaries use the configured product timezone (`APP_TIMEZONE`, default `Asia/Tehran`).
- Removing a library entry does not erase historical viewing activity.
- Movie and series discovery and recommendation filters are explicit and never blend their result lists.

## PWA

- Public GET responses may use the existing bounded runtime cache.
- Authentication, ratings, recommendations, and other private endpoints are never cached.
- Install is offered only after the browser provides an install event; iOS receives platform-specific guidance.
- The shell remains understandable offline and identifies unavailable network actions.

## Locale and accessibility

- Interface locale is Persian (`fa`) and document direction is RTL.
- English summaries use LTR at the content boundary.
- Focus is never hidden by sticky app chrome or the mobile dock.
- All primary actions and navigation targets meet touch and keyboard requirements.
