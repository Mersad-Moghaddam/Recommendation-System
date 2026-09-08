# گسترش کاتالوگ فیلم

## تصمیم داده‌ای

کاتالوگ پایهٔ پروژه، MovieLens latest-small با ۹٬۷۴۲ فیلم است. برای گسترش قابل‌تکرار و مناسب پژوهش دانشگاهی، اسکریپت `scripts/expand_movie_catalog.py` فقط فهرست فیلم‌های مجموعهٔ پایدار MovieLens 32M را وارد می‌کند. صفحهٔ رسمی GroupLens این مجموعه را برای پژوهش جدید پیشنهاد می‌کند و تعداد آن را ۸۷٬۵۸۵ فیلم اعلام کرده است:

- [صفحهٔ رسمی مجموعه‌داده‌های MovieLens در GroupLens](https://grouplens.org/datasets/movielens/)
- [README رسمی MovieLens 32M](https://files.grouplens.org/datasets/movielens/ml-32m-README.html)

از IMDb استفاده نشد؛ اگرچه فایل‌های غیرتجاری آن روزانه به‌روزرسانی می‌شوند، شرایط رسمی استفاده، بازنشر یا تبدیل داده به یک دیتابیس فیلم را جز برای استفادهٔ شخصی محدود می‌کند. خروجی روزانهٔ TMDb نیز طبق مستندات رسمی تنها فهرست شناسه‌ها و چند ویژگی سطح‌بالاست و خروجی کامل متادیتا نیست:

- [شرایط استفادهٔ غیرتجاری IMDb](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)
- [مستندات رسمی Daily ID Exports در TMDb](https://developer.themoviedb.org/docs/daily-id-exports)

## چرا فقط کاتالوگ و نه ۳۲ میلیون امتیاز؟

درخواست این مرحله گسترش تعداد فیلم‌هاست. واردکردن ۳۲ میلیون امتیاز، حجم SQLite و زمان آماده‌سازی را شدیداً افزایش می‌دهد و ماتریس آموزشی فعلی را از محدودهٔ یک پروژهٔ ساده خارج می‌کند. بنابراین:

- متادیتای ۸۷٬۵۸۵ فیلم برای جست‌وجو، فرم هوشمند، شباهت محتوایی و مدل ترکیبی در دسترس قرار می‌گیرد؛
- ۱۰۰٬۸۳۶ امتیاز latest-small برای مدل مشارکتی و محبوبیت حفظ می‌شود؛
- ۳۰ فیلم منتخب ایرانی همچنان بدون امتیاز جعلی نگهداری می‌شوند؛
- هیچ امتیاز مصنوعی از میانگین یا محبوبیت ساخته نمی‌شود.

فیلم‌های کاتالوگ گسترده که امتیاز latest-small ندارند، در محبوبیت خالص ظاهر نمی‌شوند؛ اما با ژانر در مدل محتوایی، فرم هوشمند و بخش فیلم‌های مشابه قابل پیشنهادند.

## روش اجرا

```bash
source .venv/bin/activate
python scripts/expand_movie_catalog.py
```

مراحل اسکریپت:

1. دانلود mirror فایل `movies.csv` مجموعهٔ MovieLens 32M؛
2. مقایسهٔ MD5 فایل با مقدار `0df90835c19151f9d819d0822e190797` منتشرشده در README رسمی GroupLens؛
3. رد و حذف خودکار فایل در صورت هرگونه عدم تطابق؛
4. بررسی ستون‌های `movieId`، `title` و `genres`؛
5. اطمینان از عدم ورود شناسه به بازهٔ رزروشدهٔ فیلم‌های ایرانی؛
6. درج دسته‌ای فیلم‌هایی که از قبل در SQLite نیستند؛
7. گزارش تعداد فیلم‌های بررسی‌شده، افزوده‌شده و کل دیتابیس.

به دلیل منقضی‌بودن گواهی TLS سرور فایل GroupLens در تاریخ اجرای این کار، انتقال از [mirror مجموعه در Hugging Face](https://huggingface.co/datasets/hazemessam/ml-32m/tree/main) انجام می‌شود؛ اما فایل تنها وقتی پذیرفته می‌شود که checksum آن دقیقاً با checksum رسمی GroupLens برابر باشد. CSV در `data/raw/ml-32m-movies.csv` باقی می‌ماند. فایل داده و خود SQLite در `.gitignore` هستند؛ در نتیجه مخزن دادهٔ حجیم را بازنشر نمی‌کند و هر دانشجو می‌تواند آن را بازسازی کند.

برای دانلود مجدد نسخهٔ منبع:

```bash
python scripts/expand_movie_catalog.py --force-download
```

پس از تعویض کاتالوگ در حالی که API باز است، سرور را یک‌بار restart کنید تا cache درون‌حافظه‌ای موتور نیز تازه شود.

## اعتباردهی و مجوز

این پروژه استفاده از MovieLens را تأیید می‌کند و هیچ تأیید یا حمایت رسمی از طرف دانشگاه مینه‌سوتا یا GroupLens را القا نمی‌کند. برای گزارش دانشگاهی، ارجاع پیشنهادی خود مجموعه چنین است:

F. Maxwell Harper and Joseph A. Konstan. “The MovieLens Datasets: History and Context.” ACM Transactions on Interactive Intelligent Systems, 2015. [DOI: 10.1145/2827872](https://doi.org/10.1145/2827872)

شرایط دقیق استفاده در [README رسمی MovieLens 32M](https://files.grouplens.org/datasets/movielens/ml-32m-README.html) آمده است. فایل داده و دیتابیس ساخته‌شده در Git قرار نمی‌گیرند.
