# Cinematch UX contract

## Navigation

- Hash routes and browser history remain authoritative.
- Browser back returns to the exact originating list/query when opening film details.
- Protected routes redirect to authentication and preserve the intended destination.
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
