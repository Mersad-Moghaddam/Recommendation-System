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
:root { --ink:#14213d; --accent:#ff5c35; --paper:#fffaf3; }
.stApp { background:linear-gradient(145deg,#fffaf3 0%,#f4f7ff 100%); color:var(--ink); }
[data-testid="stSidebar"] { background:#14213d; }
[data-testid="stSidebar"] * { color:#fff!important; }
.hero { padding:2.2rem; border-radius:24px; background:linear-gradient(120deg,#14213d,#273c75); color:white; margin-bottom:1.5rem; }
.hero h1 { font-size:3rem; margin:0; letter-spacing:-2px; }
.eyebrow { color:#ffb199; text-transform:uppercase; letter-spacing:2px; font-weight:700; }
.movie { min-height:170px; padding:1.15rem; border:1px solid #e5e7eb; border-radius:18px; background:rgba(255,255,255,.86); box-shadow:0 8px 25px rgba(20,33,61,.06); }
.score { color:#ff5c35; font-weight:800; }
.stButton>button { border-radius:999px; border:0; background:#ff5c35; color:white; font-weight:700; }
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

with st.sidebar:
    st.markdown("## 🎬 CineMatch")
    if st.session_state.user:
        st.caption(f'Signed in as @{st.session_state.user["username"]}')
        st.session_state.page = st.radio("Go to", ["Discover", "For you", "My ratings"], label_visibility="collapsed")
        if st.button("Sign out"):
            st.session_state.token = st.session_state.user = None; st.rerun()
    else:
        st.caption("A small, explainable movie recommender")

if not st.session_state.user:
    st.markdown('<div class="hero"><div class="eyebrow">University ML project</div><h1>Find your next favorite film.</h1><p>Real MovieLens data. Four explainable recommendation strategies. Zero mystery.</p></div>', unsafe_allow_html=True)
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
        st.markdown("### How it learns")
        st.write("Rate at least three films. CineMatch combines patterns from similar viewers with the genres you enjoy. Until then, it uses a confidence-weighted popularity baseline.")
else:
    if st.session_state.page == "Discover":
        st.markdown('<div class="hero"><div class="eyebrow">Explore the catalog</div><h1>What are you in the mood for?</h1></div>', unsafe_allow_html=True)
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
