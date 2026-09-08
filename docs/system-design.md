# CineMatch system design

## Requirements and scope

CineMatch turns real MovieLens movies and ratings into explainable recommendations, exposes them through HTTP, and lets a student demonstrate the end-to-end flow in Streamlit. It runs as two local processes and one SQLite file. Distributed deployment, third-party identity, queues, and monitoring are intentionally out of scope.

## Components

```text
Browser
  └─ Streamlit: session state, forms, movie cards
       └─ HTTP/JSON
            └─ FastAPI: validation and authentication
                 ├─ User/Movie/Rating services ── SQLite
                 └─ Recommendation service
                      └─ RecommendationEngine
                           ├─ user–item matrix
                           ├─ genre TF–IDF
                           └─ on-demand cosine similarity
```

## Main data flow

1. `download_data.py` obtains the official MovieLens archive; no dataset is embedded in source code.
2. `initialize_database.py` validates CSV columns, creates dataset-only users required by rating foreign keys, then imports movies and ratings.
3. Registration creates a salted scrypt password hash. Login returns a signed, expiring bearer token.
4. A rating is upserted under the authenticated user and changes the cache signature.
5. The next recommendation request rebuilds the cached feature structures from SQLite, ranks unseen candidates, and returns scores plus human-readable reasons.

## Design choices and tradeoffs

- **SQLite:** zero setup and easy inspection; unsuitable for many concurrent writers.
- **Single-process cache:** easy to teach and sufficient locally; each server process would own a separate cache.
- **On-demand item similarities:** avoids a quadratic dense movie-by-movie matrix; repeated requests do a little more CPU work.
- **Genre TF–IDF:** transparent and deterministic; it cannot capture story, cast, or mood.
- **HMAC token + scrypt:** keeps dependencies and code small while avoiding plaintext passwords; a deployed application should use reviewed authentication libraries and rotated secrets.

## Failure behavior

Invalid input receives a 4xx response, missing movies receive 404, duplicate usernames receive 409, and unavailable frontend HTTP calls display an actionable error. New users never fail: the engine uses popularity until three ratings are available.
