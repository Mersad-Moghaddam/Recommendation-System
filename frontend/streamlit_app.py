from pathlib import Path
import sys

# Streamlit executes this file as a script, so ensure the repository root is
# importable regardless of the directory from which the command is launched.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import streamlit as st
from frontend import api_client as api

st.set_page_config(page_title="CineMatch", page_icon="🎬", layout="wide")
st.markdown("""
<style>
:root { --night:#07080b; --panel:#121319; --red:#d73535; --gold:#e7b85b; --cream:#f4ead8; }
.stApp {
  background:
    radial-gradient(circle at 85% 5%, rgba(165,28,35,.20), transparent 28rem),
    linear-gradient(145deg,#07080b 0%,#101116 55%,#090a0d 100%);
  color:var(--cream);
}
.block-container { max-width:1280px; padding-top:2rem; }
[data-testid="stSidebar"] { background:linear-gradient(180deg,#121319,#08090c); border-right:1px solid #292a30; }
[data-testid="stSidebar"] * { color:#f4ead8!important; }
[data-testid="stSidebar"] [data-testid="stRadio"] label { padding:.45rem .7rem; border-radius:10px; }
h1,h2,h3,h4 { font-family:Georgia,serif!important; color:#fff8e9!important; }
p,small,label,.stCaption { color:#bcb7ae!important; }
.brand { font-family:Georgia,serif; font-size:1.7rem; color:#fff; letter-spacing:.04em; }
.brand span,.score { color:var(--gold); }
.hero {
  position:relative; overflow:hidden; padding:3.5rem; border-radius:8px;
  background:linear-gradient(90deg,rgba(6,7,9,.97),rgba(27,11,13,.88)),
             repeating-linear-gradient(90deg,transparent 0 70px,rgba(255,255,255,.03) 70px 72px);
  border:1px solid #33262a; box-shadow:0 24px 70px rgba(0,0,0,.45); margin-bottom:2rem;
}
.hero:after { content:'◉  ◉  ◉'; position:absolute; right:3rem; top:2.4rem; color:#39282a; font-size:4rem; letter-spacing:1rem; transform:rotate(-8deg); }
.hero h1 { font-size:clamp(2.7rem,6vw,5rem); line-height:.98; margin:.5rem 0 1rem; max-width:760px; letter-spacing:-.055em; }
.hero p { max-width:650px; font-size:1.08rem; }
.eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.2em; font-size:.74rem; font-weight:800; }
.movie { min-height:205px; padding:1.25rem; border-top:2px solid #6f262a; border-radius:5px; background:linear-gradient(160deg,#18191f,#101116); box-shadow:0 12px 35px rgba(0,0,0,.3); }
.movie h4 { min-height:3.4rem; margin:.3rem 0 .7rem; }
.movie p { font-size:.82rem; line-height:1.45; }
.score { font-weight:800; margin-top:1rem; font-size:.9rem; }
.stButton>button,.stFormSubmitButton>button { border-radius:4px; border:1px solid #e04a4a; background:linear-gradient(180deg,#d63b3b,#9d2027); color:white; font-weight:750; text-transform:uppercase; letter-spacing:.06em; }
.stButton>button:hover,.stFormSubmitButton>button:hover { border-color:var(--gold); color:white; }
[data-baseweb="input"],[data-baseweb="select"] { background:#15161b!important; }
div[data-testid="stForm"] { background:rgba(21,22,27,.75); border:1px solid #313238; border-radius:7px; padding:1.4rem; }
.algorithm { border-left:3px solid var(--gold); padding:.9rem 1.2rem; background:#14151a; margin:1rem 0 2rem; }
</style>
""", unsafe_allow_html=True)

for key, value in {"token": None, "user": None, "page": "Discover"}.items():
    st.session_state.setdefault(key, value)

def show_cards(items):
    if not items:
        st.info("No movies found yet.")
        return
    for start in range(0, len(items), 4):
        cols = st.columns(4)
        for col, movie in zip(cols, items[start:start+4]):
            with col:
                genres = " · ".join(movie.get("genres", [])[:3])
                score = f'<div class="score">{movie["score"]:.0%} match</div>' if "score" in movie else ""
                st.markdown(f'<div class="movie"><h4>{movie["title"]}</h4><small>{genres}</small>{score}<p>{movie.get("reason", "")}</p></div>', unsafe_allow_html=True)
                if st.session_state.token:
                    with st.popover("Rate this movie"):
                        value = st.select_slider("Your rating", options=[.5,1.,1.5,2.,2.5,3.,3.5,4.,4.5,5.], value=4., key=f'r{movie.get("id", movie.get("movie_id"))}')
                        if st.button("Save rating", key=f's{movie.get("id", movie.get("movie_id"))}'):
                            api.rate_movie(st.session_state.token, movie.get("id", movie.get("movie_id")), value)
                            st.success("Rating saved — recommendations are now updated.")

def show_concierge():
    st.markdown('<div class="hero"><div class="eyebrow">AI Movie Concierge</div><h1>Tell us the feeling.<br>We’ll find the film.</h1><p>Four quick choices become a taste vector and search the complete MovieLens catalog in seconds.</p></div>', unsafe_allow_html=True)
    with st.form("concierge"):
        left, right = st.columns(2)
        with left:
            mood = st.selectbox("What should the movie make you feel?", ["Feel-good", "Thrilled", "Thoughtful", "Escape", "Comfort", "Surprise me"])
            genres = st.multiselect("Choose up to five genres", ["Action", "Adventure", "Animation", "Children", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"], max_selections=5)
        with right:
            era = st.selectbox("Pick a cinematic era", ["Any era", "Classics", "80s & 90s", "2000s", "Modern"])
            discovery = st.slider("Familiar favorites  —  Hidden gems", 0, 100, 55, help="Higher values reduce the popularity influence and favor pure taste similarity.")
        submitted = st.form_submit_button("Reveal my movies", use_container_width=True)
    st.markdown('<div class="algorithm"><b>How the AI decides</b><br><small>Mood + genres → TF–IDF vector → cosine similarity → era filter → confidence-weighted community score.</small></div>', unsafe_allow_html=True)
    if submitted:
        try:
            with st.spinner("The projector is searching the archive…"):
                results = api.quiz_recommendations(mood, genres, era, discovery)
            st.markdown("## Tonight’s selection")
            show_cards(results)
        except api.APIError as exc:
            st.error(str(exc))

with st.sidebar:
    st.markdown('<div class="brand">CINE<span>MATCH</span></div>', unsafe_allow_html=True)
    st.caption("Personal cinema, powered by data")
    if st.session_state.user:
        st.caption(f'Signed in as @{st.session_state.user["username"]}')
        st.session_state.page = st.radio("Go to", ["AI Concierge", "Discover", "For you", "My ratings"], label_visibility="collapsed")
        if st.button("Sign out"):
            st.session_state.token = st.session_state.user = None; st.rerun()
    else:
        st.session_state.page = st.radio("Go to", ["AI Concierge", "Sign in"], label_visibility="collapsed")

if st.session_state.page == "AI Concierge":
    show_concierge()
elif not st.session_state.user:
    st.markdown('<div class="hero"><div class="eyebrow">Members entrance</div><h1>Your watch history<br>has good taste.</h1><p>Sign in to rate films and unlock recommendations learned from viewers with similar taste.</p></div>', unsafe_allow_html=True)
    left, right = st.columns([1, 1.4])
    with left:
        mode = st.segmented_control("Account", ["Log in", "Register"], default="Log in")
        with st.form("auth"):
            username = st.text_input("Username", placeholder="movie_fan")
            password = st.text_input("Password", type="password", placeholder="At least 6 characters")
            submitted = st.form_submit_button(mode, use_container_width=True)
        if submitted:
            try:
                result = api.login(username, password) if mode == "Log in" else api.register(username, password)
                st.session_state.token, st.session_state.user = result["access_token"], result["user"]
                st.rerun()
            except api.APIError as exc: st.error(str(exc))
    with right:
        st.markdown("### Three layers of intelligence")
        st.write("**01 — Collaborative**  Finds patterns among viewers with similar ratings.")
        st.write("**02 — Content**  Learns which genres appear in films you love.")
        st.write("**03 — Hybrid**  Blends both signals while filtering movies you already rated.")
else:
    if st.session_state.page == "Discover":
        st.markdown('<div class="hero"><div class="eyebrow">The MovieLens archive</div><h1>Every title is<br>a new possibility.</h1><p>Search 9,742 real movies and add your rating to improve the model.</p></div>', unsafe_allow_html=True)
        query = st.text_input("Search titles", placeholder="Try: Toy Story", label_visibility="collapsed")
        try: show_cards(api.get_movies(query))
        except api.APIError as exc: st.error(str(exc))
    elif st.session_state.page == "For you":
        st.markdown("# Made for you")
        method = st.segmented_control("Recommendation model", ["hybrid", "collaborative", "content", "popular"], default="hybrid")
        st.caption("Hybrid is recommended after you rate three movies; cold-start users automatically receive popular choices.")
        try: show_cards(api.recommendations(st.session_state.token, method))
        except api.APIError as exc: st.error(str(exc))
    else:
        st.markdown("# Your rating history")
        try:
            rows = api.my_ratings(st.session_state.token)
            if rows: st.dataframe(rows, use_container_width=True, hide_index=True)
            else: st.info("You have not rated a movie yet. Start in Discover.")
        except api.APIError as exc: st.error(str(exc))
