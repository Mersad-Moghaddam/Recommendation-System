# سینمچ — پیشنهاد فیلم برای امشب

سینمچ یک PWA فارسی و نصب‌پذیر برای کشف و پیشنهاد توضیح‌پذیر فیلم است. خانه، جست‌وجو، جزئیات و فیلم‌های مشابه عمومی‌اند؛ پیشنهاد هوشمند، امتیازدهی و پیشنهادهای شخصی پس از ساخت حساب فعال می‌شوند.

## قابلیت‌های اصلی

- پیشنهادگر هیبرید: `TruncatedSVD` روی امتیازهای mean-centered، bias کاربر/فیلم، نمایهٔ محتوایی metadata و کیفیت بیزی
- وزن‌دهی پویا برای شروع سرد و کاربران باتجربه، بازچینی MMR و سه حالت «متعادل»، «آشنا و مطمئن» و «کشف تازه»
- فرم دوازده‌حالته با حداکثر دو حس، دلیل واقعی هر پیشنهاد و onboarding سه‌فیلمه
- خلاصهٔ بدون اسپویل فارسی با fallback انگلیسی و جهت نمایش درست
- جست‌وجوی FTS5 با نرمال‌سازی نویسه‌ها و ارقام فارسی، ژانر و فیلتر سینمای ایران
- نشست امضاشده در cookie از نوع `HttpOnly` و `SameSite=Strict`، همراه کنترل Origin روی درخواست‌های تغییردهنده
- PWA تک‌دامنه با نصب، راهنمای iOS، وضعیت آفلاین و اعلان به‌روزرسانی؛ داده‌های خصوصی cache نمی‌شوند
- رابط RTL واکنش‌گرا با Estedad، Vazirmatn، targetهای حداقل ۴۴ پیکسل و پشتیبانی reduced motion

## معماری

```text
MovieLens links.csv + TMDB
            ↓ enrichment آفلاین
SQLite metadata + FTS5 ──→ artifact نسخه‌دار مدل
            ↓
پروفایل لحظه‌ای کاربر → Hybrid scoring → MMR diversity → کارت‌های فیلم
```

FastAPI پس از مسیرهای `/api`، build فرانت را از همان origin سرو می‌کند. مدل و ماتریس‌ها هنگام startup از artifact بارگذاری می‌شوند؛ امتیاز تازه بلافاصله پروفایل همان کاربر را تغییر می‌دهد و مدل سراسری را داخل request بازسازی نمی‌کند. جزئیات بیشتر در [طراحی سامانه](docs/system-design.md) آمده است.

## نصب و آماده‌سازی

Python 3.11 تا 3.14 و Node.js جدید لازم است:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install --prefix frontend
python scripts/download_data.py
python scripts/initialize_database.py
python scripts/expand_movie_catalog.py
python scripts/train_models.py
```

`expand_movie_catalog.py` فایل‌های `movies.csv` و `links.csv` از MovieLens 32M را با checksum رسمی کنترل و به‌شکل idempotent وارد می‌کند. داده‌ها، دیتابیس و artifact مدل عمداً وارد Git نمی‌شوند.

### افزودن خلاصه و metadata از TMDB

یک TMDB API Read Access Token در محیط قرار دهید و enrichment قابل‌ادامه را اجرا کنید:

```bash
export TMDB_READ_TOKEN='...'
python scripts/enrich_movie_metadata.py
python scripts/train_models.py
```

اسکریپت ابتدا `fa-IR` و سپس `en-US` را می‌گیرد، `Retry-After` و retry نمایی را رعایت می‌کند، دسته‌ای upsert می‌کند و درصد پوشش می‌دهد. اصلاح دستی خلاصه‌های ناقص یا اسپویل‌دار در `data/metadata_overrides.json` ثبت می‌شود. گزینه‌های کامل در `python scripts/enrich_movie_metadata.py --help` در دسترس‌اند.

## اجرا

برای توسعه، API و Vite را جدا اجرا کنید:

```bash
uvicorn app.main:app --reload
npm run dev --prefix frontend
```

برای اجرای تک‌دامنهٔ محصولی:

```bash
npm run build --prefix frontend
APP_ENV=production SECRET_KEY='a-long-random-secret' uvicorn app.main:app
```

- رابط و API: `http://127.0.0.1:8000`
- مستندات API: `http://127.0.0.1:8000/docs`
- سلامت سرویس: `http://127.0.0.1:8000/health`

در production حتماً HTTPS استفاده کنید؛ cookie نشست در این حالت `Secure` می‌شود.

## API مهم

| دسترسی | روش | مسیر | کاربرد |
|---|---|---|---|
| عمومی | GET | `/health` | سلامت سامانه |
| عمومی | GET | `/api/movies` | فهرست، FTS و فیلتر فیلم |
| عمومی | GET | `/api/movies/{id}/details` | جزئیات و metadata |
| عمومی | GET | `/api/movies/{id}/similar` | فیلم‌های مشابه |
| عمومی | POST | `/api/auth/register` | ساخت حساب و cookie نشست |
| عمومی | POST | `/api/auth/login` | ورود و cookie نشست |
| عضو | GET | `/api/auth/me` | کاربر و وضعیت onboarding |
| عضو | POST | `/api/ratings/bulk` | ذخیرهٔ امتیازهای onboarding |
| عضو | GET | `/api/recommendations/me` | پیشنهاد هیبرید شخصی |
| عضو | POST | `/api/recommendations/quiz` | پیشنهاد بر اساس حس امشب |

همهٔ درخواست‌های مرورگر با `credentials: include` ارسال می‌شوند. پاسخ ورود توکن قابل‌خواندن برای JavaScript ندارد.

## آزمون و ارزیابی

```bash
pytest -q
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm run test:e2e --prefix frontend
python scripts/evaluate_models.py --users 20
```

ارزیابی از split زمانی بدون leakage و آخرین امتیاز مثبت (`>=4`) استفاده و `HitRate@10`، `NDCG@10`، `MRR@10`، coverage و intra-list diversity را گزارش می‌کند.

## داده، مجوز و اعتبار

پروژه دانشگاهی و غیرتجاری است. شرایط MovieLens استفادهٔ تجاری را محدود می‌کند. محصول از TMDB API استفاده می‌کند اما مورد تأیید یا گواهی TMDB نیست؛ لوگوی رسمی و همین اعلان در بخش «درباره» رابط نیز نمایش داده می‌شوند. برای استفادهٔ تجاری شرایط و مجوزهای [MovieLens 32M](https://files.grouplens.org/datasets/movielens/ml-32m-README.html) و [TMDB API](https://developer.themoviedb.org/docs/faq) را جداگانه بررسی کنید.

آرشیو چندگیگابایتی پوسترها، تأیید ایمیل و همگام‌سازی آفلاین امتیازها خارج از محدودهٔ این نسخه‌اند.
