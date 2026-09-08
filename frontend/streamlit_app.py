from pathlib import Path
import base64
import sys

# Streamlit executes this file as a script, so ensure the repository root is
# importable regardless of the directory from which the command is launched.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import streamlit as st
from frontend import api_client as api

font_data = base64.b64encode((PROJECT_ROOT / "frontend/assets/Estedad.woff2").read_bytes()).decode()
st.set_page_config(page_title="سینمچ | پیشنهاد هوشمند فیلم", page_icon="🎬", layout="wide")
st.markdown(f"<style>@font-face{{font-family:Estedad;src:url(data:font/woff2;base64,{font_data}) format('woff2');font-weight:100 900;font-display:swap}}</style>", unsafe_allow_html=True)
st.markdown("""
<style>
:root { --night:#07080b; --panel:#121319; --red:#d73535; --gold:#e7b85b; --cream:#f4ead8; }
.stApp {
  background:
    radial-gradient(circle at 85% 5%, rgba(165,28,35,.20), transparent 28rem),
    linear-gradient(145deg,#07080b 0%,#101116 55%,#090a0d 100%);
  color:var(--cream);
  direction:rtl;
  font-family:Estedad,sans-serif!important;
}
.stApp * { font-family:Estedad,sans-serif; }
.block-container { max-width:1280px; padding-top:2rem; }
[data-testid="stSidebar"] { background:linear-gradient(180deg,#121319,#08090c); border-right:1px solid #292a30; }
[data-testid="stSidebar"] * { color:#f4ead8!important; }
[data-testid="stSidebar"] [data-testid="stRadio"] label { padding:.45rem .7rem; border-radius:10px; }
h1,h2,h3,h4 { font-family:Estedad,sans-serif!important; color:#fff8e9!important; }
p,small,label,.stCaption { color:#bcb7ae!important; }
.brand { font-family:Estedad,sans-serif; font-size:1.7rem; color:#fff; }
.brand span,.score { color:var(--gold); }
.hero {
  position:relative; overflow:hidden; padding:3.5rem; border-radius:8px;
  background:linear-gradient(90deg,rgba(6,7,9,.97),rgba(27,11,13,.88)),
             repeating-linear-gradient(90deg,transparent 0 70px,rgba(255,255,255,.03) 70px 72px);
  border:1px solid #33262a; box-shadow:0 24px 70px rgba(0,0,0,.45); margin-bottom:2rem;
}
.hero:after { content:'◉  ◉  ◉'; position:absolute; left:3rem; top:2.4rem; color:#39282a; font-size:4rem; letter-spacing:1rem; transform:rotate(8deg); }
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
.algorithm { border-right:3px solid var(--gold); padding:.9rem 1.2rem; background:#14151a; margin:1rem 0 2rem; }
</style>
""", unsafe_allow_html=True)

for key, value in {"token": None, "user": None, "page": "AI Concierge"}.items():
    st.session_state.setdefault(key, value)

GENRE_FA = {
    "Action":"اکشن", "Adventure":"ماجراجویی", "Animation":"انیمیشن", "Children":"کودک",
    "Comedy":"کمدی", "Crime":"جنایی", "Documentary":"مستند", "Drama":"درام",
    "Fantasy":"فانتزی", "Film-Noir":"نوآر", "Horror":"ترسناک", "Musical":"موزیکال",
    "Mystery":"معمایی", "Romance":"عاشقانه", "Sci-Fi":"علمی‌تخیلی", "Thriller":"هیجان‌انگیز",
    "War":"جنگی", "Western":"وسترن"
}

def show_cards(items):
    if not items:
        st.info("فیلمی با این ویژگی‌ها پیدا نشد؛ انتخاب‌ها را کمی گسترده‌تر کنید.")
        return
    for start in range(0, len(items), 4):
        cols = st.columns(4)
        for col, movie in zip(cols, items[start:start+4]):
            with col:
                genres = " · ".join(GENRE_FA.get(g, g) for g in movie.get("genres", [])[:3])
                score = f'<div class="score">{movie["score"]:.0%} هماهنگی</div>' if "score" in movie else ""
                st.markdown(f'<div class="movie"><h4>{movie["title"]}</h4><small>{genres}</small>{score}<p>{movie.get("reason", "")}</p></div>', unsafe_allow_html=True)
                if st.session_state.token:
                    with st.popover("به این فیلم امتیاز بده"):
                        value = st.select_slider("امتیاز شما", options=[.5,1.,1.5,2.,2.5,3.,3.5,4.,4.5,5.], value=4., key=f'r{movie.get("id", movie.get("movie_id"))}')
                        if st.button("ثبت امتیاز", key=f's{movie.get("id", movie.get("movie_id"))}'):
                            api.rate_movie(st.session_state.token, movie.get("id", movie.get("movie_id")), value)
                            st.success("امتیاز ثبت شد؛ پیشنهادهای شما به‌روز شدند.")

def show_concierge():
    st.markdown('<div class="hero"><div class="eyebrow">پیشنهادگر هوشمند فیلم</div><h1>حال‌وهوایت را بگو؛<br>فیلمش را پیدا می‌کنیم.</h1><p>پاسخ‌های کوتاه شما به بردار سلیقه تبدیل می‌شوند و میان هزاران فیلم واقعی جست‌وجو می‌کنند.</p></div>', unsafe_allow_html=True)
    with st.form("concierge"):
        left, right = st.columns(2)
        with left:
            mood_map = {"شاد و سرحال":"Feel-good", "پرهیجان":"Thrilled", "فکری و عمیق":"Thoughtful", "فرار از روزمرگی":"Escape", "آرام و صمیمی":"Comfort", "غافلگیرم کن":"Surprise me"}
            mood_fa = st.selectbox("دوست داری فیلم چه حسی به تو بدهد؟", list(mood_map))
            genre_labels = st.multiselect("حداکثر پنج ژانر انتخاب کن", list(GENRE_FA.values()), max_selections=5)
            genres = [key for label in genre_labels for key, value in GENRE_FA.items() if value == label]
        with right:
            era_map = {"همهٔ دوره‌ها":"Any era", "کلاسیک؛ پیش از ۱۹۸۰":"Classics", "دههٔ ۸۰ و ۹۰ میلادی":"80s & 90s", "سال‌های ۲۰۰۰ تا ۲۰۱۴":"2000s", "مدرن؛ ۲۰۱۵ به بعد":"Modern"}
            era_fa = st.selectbox("دورهٔ سینمایی مورد علاقه", list(era_map))
            origin_map = {"سینمای ایران و جهان":"Any", "فقط سینمای ایران":"Iranian", "فقط سینمای جهان":"International"}
            origin_fa = st.selectbox("کدام سینما؟", list(origin_map))
            discovery = st.slider("محبوب و آشنا  ←  کشف فیلم‌های کمتر دیده‌شده", 0, 100, 55, help="عدد بالاتر، اثر محبوبیت عمومی را کم و شباهت سلیقه‌ای را بیشتر می‌کند.")
        submitted = st.form_submit_button("فیلم‌های مناسب من را پیدا کن", use_container_width=True)
    st.markdown('<div class="algorithm"><b>هوش مصنوعی چگونه تصمیم می‌گیرد؟</b><br><small>حال‌وهوا + ژانرها ← بردار TF–IDF ← شباهت کسینوسی ← فیلتر دوره و کشور ← امتیاز قابل اعتماد کاربران</small></div>', unsafe_allow_html=True)
    if submitted:
        try:
            with st.spinner("آپاراتچی در حال جست‌وجوی آرشیو است…"):
                results = api.quiz_recommendations(mood_map[mood_fa], genres, era_map[era_fa], discovery, origin_map[origin_fa])
            st.markdown("## انتخاب‌های امشب برای شما")
            show_cards(results)
        except api.APIError as exc:
            st.error(str(exc))

with st.sidebar:
    st.markdown('<div class="brand">سین<span>مچ</span></div>', unsafe_allow_html=True)
    st.caption("سینمای شخصی شما، با قدرت داده")
    if st.session_state.user:
        st.caption(f'واردشده با نام @{st.session_state.user["username"]}')
        page_labels = {"AI Concierge":"پیشنهادگر هوشمند", "Discover":"جست‌وجوی فیلم", "For you":"ویژهٔ شما", "My ratings":"امتیازهای من"}
        st.session_state.page = st.radio("بخش‌ها", list(page_labels), format_func=page_labels.get, label_visibility="collapsed")
        if st.button("خروج از حساب"):
            st.session_state.token = st.session_state.user = None; st.rerun()
    else:
        guest_labels = {"AI Concierge":"پیشنهادگر هوشمند", "Sign in":"ورود یا ثبت‌نام"}
        st.session_state.page = st.radio("بخش‌ها", list(guest_labels), format_func=guest_labels.get, label_visibility="collapsed")

if st.session_state.page == "AI Concierge":
    show_concierge()
elif not st.session_state.user:
    st.markdown('<div class="hero"><div class="eyebrow">ورود اعضا</div><h1>سابقهٔ تماشای تو<br>سلیقه‌ات را می‌شناسد.</h1><p>وارد شو، به فیلم‌ها امتیاز بده و پیشنهادهایی را ببین که از کاربران هم‌سلیقه یاد گرفته‌اند.</p></div>', unsafe_allow_html=True)
    left, right = st.columns([1, 1.4])
    with left:
        mode = st.segmented_control("حساب کاربری", ["ورود", "ثبت‌نام"], default="ورود")
        with st.form("auth"):
            username = st.text_input("نام کاربری", placeholder="movie_fan")
            password = st.text_input("رمز عبور", type="password", placeholder="حداقل ۶ نویسه")
            submitted = st.form_submit_button(mode, use_container_width=True)
        if submitted:
            try:
                result = api.login(username, password) if mode == "ورود" else api.register(username, password)
                st.session_state.token, st.session_state.user = result["access_token"], result["user"]
                st.rerun()
            except api.APIError as exc: st.error(str(exc))
    with right:
        st.markdown("### سه لایهٔ هوشمندی")
        st.write("**۱ — مشارکتی:** الگوی امتیاز کاربران هم‌سلیقه را پیدا می‌کند.")
        st.write("**۲ — محتوایی:** ژانر فیلم‌هایی را که دوست داشته‌ای یاد می‌گیرد.")
        st.write("**۳ — ترکیبی:** هر دو سیگنال را ادغام و فیلم‌های دیده‌شده را حذف می‌کند.")
else:
    if st.session_state.page == "Discover":
        st.markdown('<div class="hero"><div class="eyebrow">آرشیو سینمچ</div><h1>هر فیلم، یک<br>امکان تازه است.</h1><p>میان هزاران فیلم ایرانی و بین‌المللی جست‌وجو کن و با امتیازهایت مدل را بهتر کن.</p></div>', unsafe_allow_html=True)
        query = st.text_input("جست‌وجوی نام فیلم", placeholder="مثلاً: جدایی یا Toy Story", label_visibility="collapsed")
        catalog = st.segmented_control("نوع آرشیو", ["همهٔ فیلم‌ها", "سینمای ایران"], default="همهٔ فیلم‌ها")
        try: show_cards(api.get_movies(query, catalog == "سینمای ایران"))
        except api.APIError as exc: st.error(str(exc))
    elif st.session_state.page == "For you":
        st.markdown("# انتخاب‌شده برای شما")
        method_labels = {"hybrid":"ترکیبی", "collaborative":"کاربران هم‌سلیقه", "content":"شباهت محتوایی", "popular":"محبوب‌ترین‌ها"}
        method = st.segmented_control("مدل پیشنهاد", list(method_labels), format_func=method_labels.get, default="hybrid")
        st.caption("پس از امتیاز دادن به سه فیلم، مدل ترکیبی فعال می‌شود؛ کاربران تازه ابتدا پیشنهادهای محبوب را می‌بینند.")
        try: show_cards(api.recommendations(st.session_state.token, method))
        except api.APIError as exc: st.error(str(exc))
    else:
        st.markdown("# تاریخچهٔ امتیازهای شما")
        try:
            rows = api.my_ratings(st.session_state.token)
            if rows:
                localized = [{"شناسه": r["movie_id"], "امتیاز": r["rating"]} for r in rows]
                st.dataframe(localized, use_container_width=True, hide_index=True)
            else: st.info("هنوز به فیلمی امتیاز نداده‌اید؛ از بخش جست‌وجوی فیلم شروع کنید.")
        except api.APIError as exc: st.error(str(exc))
