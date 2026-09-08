# CineMatch — Movie Recommendation System

CineMatch is a complete but deliberately small university project that demonstrates how a modern recommendation system works. It uses real MovieLens ratings, a FastAPI service, SQLite, and a polished Streamlit interface. The project favors code that is easy to explain in a defense over production infrastructure.

## What the project demonstrates

- Confidence-weighted popularity recommendations for new users
- Item-based collaborative filtering from rating behavior
- Genre-based content recommendations using TF–IDF and cosine similarity
- A normalized hybrid score combining collaborative and content signals
- An AI Movie Concierge that turns a four-question form into recommendations
- Registration, login, password hashing, ratings, browsing, and recommendations
- Clean separation between UI, API/services, database, and ML code

The default dataset is [MovieLens latest-small](https://files.grouplens.org/datasets/movielens/), maintained by GroupLens. It contains roughly 100,000 ratings across about 9,700 movies and is intended for education/research use; read the downloaded dataset README for its terms.

## Architecture

```text
Streamlit UI  →  FastAPI routes  →  Services  →  SQLite
                                      ↓
                            RecommendationEngine
                       (Pandas + NumPy + scikit-learn)
```

The frontend contains presentation and API calls only. Recommendation mathematics lives in `recommender/engine.py`, independent of FastAPI and Streamlit. See [docs/system-design.md](docs/system-design.md) for the data flow and tradeoffs.

## Quick start

Python 3.11–3.13 is recommended. From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/download_data.py
python scripts/initialize_database.py
python scripts/train_models.py
```

Start the API in terminal one:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

Start the UI in terminal two:

```bash
source .venv/bin/activate
streamlit run frontend/streamlit_app.py
```

Open `http://localhost:8501`. Interactive API documentation is at `http://127.0.0.1:8000/docs`; ReDoc is at `/redoc`.

## Demo flow

1. Register a local account.
2. Search the catalog and rate at least three movies.
3. Open **For you** and compare hybrid, collaborative, content, and popular results.
4. Explain why rated movies are excluded and why a new user sees the popularity baseline.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Create account and return token |
| POST | `/auth/login` | Authenticate and return token |
| GET | `/movies?q=` | Browse/search movies |
| GET | `/movies/{id}` | Movie details |
| POST | `/ratings` | Create or update the current user's rating |
| GET | `/users/me/ratings` | Current user's rating history |
| GET | `/recommendations/me?method=hybrid` | Personalized/cold-start list |
| POST | `/recommendations/quiz` | Mood, genre, era, and discovery recommendations |
| GET | `/movies/{id}/similar` | Genre-similar movies |

Protected endpoints accept `Authorization: Bearer <token>`.

## Algorithms in plain language

**Popularity** uses a Bayesian-style weighted mean. A movie with one five-star rating cannot outrank a consistently strong film with many ratings.

**Collaborative filtering** represents each movie by the users who rated it. Cosine similarity finds movies with similar rating patterns. A user's centered ratings weight candidate movies, and watched items are removed.

**Content-based filtering** converts pipe-separated genres into TF–IDF vectors. It builds a taste profile from movies the user rated at least 3.5 and retrieves the closest unseen genre vectors.

**Hybrid** min–max normalizes both candidate scores and combines them: `0.65 × collaborative + 0.35 × content`. With fewer than three ratings, it automatically falls back to popularity.

**AI Movie Concierge** converts the visitor's mood and selected genres into the same TF–IDF feature space as the catalog. Cosine similarity measures fit, an era choice filters candidates, and a discovery slider controls how much the confidence-weighted community score influences ranking. It needs no account or rating history.

Missing values in the user–item matrix mean “not rated,” not a zero-star opinion. They are filled with zero only at the cosine-computation boundary, where zero represents no observed interaction.

## Evaluation

Run a small leave-one-out ranking experiment:

```bash
python scripts/evaluate_models.py
```

For each eligible user, their latest rating is hidden, models train without it, and HitRate@10 records whether the held-out movie appears. This avoids using the answer during training. Ranking metrics are more appropriate here than RMSE because the application returns ordered lists rather than explicit rating predictions.

## Tests

```bash
pytest
```

Tests cover missing-value semantics, content similarity, watched-item exclusion, cold start, invalid methods, password hashing, signed tokens, and the health endpoint.

## Scope and limitations

- This is a local academic app, not a production service. Tokens use a compact educational HMAC implementation and expire after one day.
- Genre-only content features are explainable but less expressive than plots, cast, tags, or embeddings.
- The model cache is process-local and invalidates when ratings change.
- MovieLens has no poster images, so the UI uses typography and genre metadata rather than fake posters.
- Offline evaluation is sampled to stay fast on a laptop.

Natural extensions are tag features, time-aware splitting, Precision@K/Recall@K across several relevant held-out items, matrix factorization, and poster metadata from a separately licensed API.
