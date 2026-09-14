export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

const FA_GENRE_LABELS = {
  Action: 'اکشن',
  Adventure: 'ماجراجویی',
  Animation: 'انیمیشن',
  Children: 'کودک',
  Comedy: 'کمدی',
  Crime: 'جنایی',
  Documentary: 'مستند',
  Drama: 'درام',
  Fantasy: 'فانتزی',
  'Film-Noir': 'نوآر',
  Horror: 'ترسناک',
  Musical: 'موزیکال',
  Mystery: 'معمایی',
  Romance: 'عاشقانه',
  'Sci-Fi': 'علمی‌تخیلی',
  Thriller: 'هیجان‌انگیز',
  War: 'جنگی',
  Western: 'وسترن',
  '(no genres listed)': 'بدون ژانر',
}

const EN_GENRE_LABELS = {
  Action: 'Action', Adventure: 'Adventure', Animation: 'Animation', Children: 'Children', Comedy: 'Comedy', Crime: 'Crime', Documentary: 'Documentary', Drama: 'Drama', Fantasy: 'Fantasy', 'Film-Noir': 'Film-Noir', Horror: 'Horror', Musical: 'Musical', Mystery: 'Mystery', Romance: 'Romance', 'Sci-Fi': 'Sci-Fi', Thriller: 'Thriller', War: 'War', Western: 'Western', '(no genres listed)': 'No genres listed',
}

export const GENRE_LABELS = {}
export const GENRE_OPTIONS = []

export const NAV_ITEMS = []

const FA_NAV_ITEMS = [
  { id: 'home', label: 'خانه' },
  { id: 'discover', label: 'کشف آثار' },
  { id: 'recommendations', label: 'ویژهٔ من', auth: true },
  { id: 'tracker', label: 'دفتر تماشا', auth: true },
  { id: 'profile', label: 'پروفایل', auth: true },
]

const EN_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'recommendations', label: 'For you', auth: true },
  { id: 'tracker', label: 'Watch tracker', auth: true },
  { id: 'profile', label: 'Profile', auth: true },
]

export const MOOD_OPTIONS = []
const FA_MOOD_OPTIONS = [
  ['feel_good', 'حال‌خوب‌کن'],
  ['need_laugh', 'نیاز به خنده'],
  ['low_energy', 'کم‌انرژی'],
  ['thrill', 'پرهیجان'],
  ['thoughtful', 'فکری'],
  ['emotional', 'احساسی'],
  ['cozy', 'آرام و صمیمی'],
  ['romantic', 'عاشقانه'],
  ['inspired', 'الهام‌بخش'],
  ['nostalgic', 'نوستالژیک'],
  ['escape', 'فرار از روزمرگی'],
  ['surprise', 'غافلگیرم کن'],
]

const EN_MOOD_OPTIONS = [
  ['feel_good', 'Feel-good'], ['need_laugh', 'Need a laugh'], ['low_energy', 'Low energy'], ['thrill', 'Thrilling'], ['thoughtful', 'Thoughtful'], ['emotional', 'Emotional'], ['cozy', 'Cozy'], ['romantic', 'Romantic'], ['inspired', 'Inspired'], ['nostalgic', 'Nostalgic'], ['escape', 'Escape'], ['surprise', 'Surprise me'],
]

export const ERA_OPTIONS = []
const FA_ERA_OPTIONS = [
  ['Any era', 'همهٔ دوره‌ها'],
  ['Classics', 'کلاسیک'],
  ['80s & 90s', 'دههٔ ۸۰ و ۹۰'],
  ['2000s', '۲۰۰۰ تا ۲۰۱۴'],
  ['Modern', 'مدرن'],
]

const EN_ERA_OPTIONS = [['Any era', 'Any era'], ['Classics', 'Classics'], ['80s & 90s', '80s & 90s'], ['2000s', '2000s to 2014'], ['Modern', 'Modern']]

export const ORIGIN_OPTIONS = []
const FA_ORIGIN_OPTIONS = [
  ['Any', 'ایران و جهان'],
  ['Iranian', 'فقط ایران'],
  ['International', 'فقط جهان'],
]

const EN_ORIGIN_OPTIONS = [['Any', 'Iran and the world'], ['Iranian', 'Iranian only'], ['International', 'International only']]

export const MODE_OPTIONS = []
const FA_MODE_OPTIONS = [
  ['balanced', 'متعادل'],
  ['familiar', 'آشنا و مطمئن'],
  ['explore', 'کشف تازه'],
]

const EN_MODE_OPTIONS = [['balanced', 'Balanced'], ['familiar', 'Familiar picks'], ['explore', 'Explore more']]

const FA_COPY = {
  app: {
    documentTitle: 'سینمچ | پیشنهاد و پیگیری فیلم و سریال',
    skipLink: 'رفتن به محتوای اصلی',
    loadingPage: 'در حال آماده‌سازی پرده…',
    welcome: 'خوش آمدی؛ حساب شما آماده است.',
    loggedOut: 'از حساب خارج شدید.',
    ratingSaved: 'امتیاز ثبت شد و پیشنهادهای شما به‌روز شدند.',
    watchlistSaved: 'به واچ‌لیست اضافه شد.',
    watchedSaved: 'در فهرست دیده‌شده‌ها ثبت شد.',
    unknownError: 'یک خطای پیش‌بینی‌نشده رخ داد؛ دوباره تلاش کنید.',
  },
  apiErrors: {
    network: 'ارتباط با سرور برقرار نشد. مطمئن شوید FastAPI در حال اجراست.',
    generic: 'در انجام درخواست مشکلی پیش آمد؛ دوباره تلاش کنید.',
  },
  layout: {
    navLabel: 'منوی اصلی',
    brandLabel: 'سینمچ، صفحهٔ اصلی',
    brandStart: 'سین',
    brandEnd: 'مچ',
    tagline: 'انتخاب و پیگیری فیلم و سریال',
    welcome: 'خوش آمدی',
    logout: 'خروج از حساب',
    account: 'حساب و دفتر تماشا',
    login: 'ورود یا ثبت‌نام',
    footerEyebrow: 'پایان این پرده، آغاز انتخاب بعدی',
    footerTitle: 'برای شب بعدی آماده‌ای؟',
    footerText: 'سینمچ انتخاب فیلم را کوتاه‌تر، شخصی‌تر و توضیح‌پذیر می‌کند؛ تا وقتت صرف تماشا شود، نه جست‌وجو.',
    footerData: 'این محصول از API تی‌ام‌دی‌بی استفاده می‌کند اما مورد تأیید یا گواهی TMDB نیست. امتیازها از MovieLens هستند.',
    footerNavLabel: 'پیوندهای فوتر', nowShowing: 'اکنون روی پرده', languageLabel: 'زبان', switchToEnglish: 'تغییر زبان به انگلیسی', switchToPersian: 'تغییر زبان به فارسی', themeDark: 'فعال‌کردن نمای تاریک', themeLight: 'فعال‌کردن نمای روشن', themeDarkShort: 'تاریک', themeLightShort: 'روشن', tmdbLabel: 'وب‌سایت TMDB',
  },
  home: {
    eyebrow: 'پیشنهاد فیلم، دقیقاً برای همین امشب',
    titleStart: 'کمتر بگرد؛',
    titleAccent: 'بهتر تماشا کن.',
    description: 'سینمچ از حال‌وهوای تو و الگوی هزاران امتیاز واقعی کمک می‌گیرد تا فیلم یا سریال بعدی‌ات اتفاقی نباشد.',
    primaryAction: 'ساخت پیشنهاد امشب',
    secondaryAction: 'ورود به آرشیو',
    proof: 'بدون حدس تصادفی · توضیح‌پذیر · سریع',
    statsLabel: 'آمار سامانه',
    statMovies: 'فیلم در آرشیو',
    statSerials: 'سریال در آرشیو',
    statRatings: 'امتیاز واقعی',
    statUsers: 'عضو سینمچ',
    statPersian: 'فیلم ایرانی منتخب',
    howEyebrow: 'پشت صحنهٔ پیشنهاد',
    howTitle: 'سه قدم تا فیلم درست',
    featureOneTitle: 'حال امشبت را می‌گیریم',
    featureOneText: 'چند پاسخ کوتاه، سلیقهٔ لحظه‌ای تو را به داده‌ای قابل تحلیل تبدیل می‌کند.',
    featureTwoTitle: 'هزاران اثر را می‌سنجیم',
    featureTwoText: 'ژانر، شباهت و کیفیت جمعی هم‌زمان بررسی می‌شوند؛ نه فقط یک فهرست محبوب.',
    featureThreeTitle: 'دلیل انتخاب را می‌گوییم',
    featureThreeText: 'هر پیشنهاد با درصد هماهنگی و توضیح روشن می‌آید تا تصمیم نهایی با خودت باشد.',
    iranianEyebrow: 'روی پردهٔ ایران',
    iranianTitle: 'چند انتخاب نزدیک‌تر',
    viewAll: 'مشاهدهٔ همه',
  },
  concierge: {
    eyebrow: 'دستیار انتخاب امشب',
    titleStart: 'حال تو،',
    titleAccent: 'فیلم تو.',
    description: 'حس اصلی و یک حس مکمل را انتخاب کن؛ فهرستی شخصی، متنوع و آمادهٔ تماشا تحویل بگیر.',
    progress: 'پنج انتخاب کوتاه تا فهرست امشب',
    summaryTitle: 'انتخاب‌های امشب',
    summaryHint: 'این خلاصه هم‌زمان با انتخاب‌های تو به‌روز می‌شود.',
    summaryMood: 'حال‌وهوا',
    summaryGenres: 'ژانرها',
    summaryOrigin: 'مبدأ سینما',
    summaryEra: 'دورهٔ زمانی',
    summaryDiscovery: 'میزان کشف',
    noGenres: 'آزاد؛ بدون محدودیت ژانر',
    discoveryValue: (value) => `${value}٪ ماجراجویی`,
    moodTitle: 'امشب چه حسی می‌خواهی؟',
    moodHint: 'یک حس اصلی و در صورت نیاز یک حس مکمل؛ غافلگیرم کن مستقل است',
    genresTitle: 'کدام دنیاها جذبت می‌کنند؟',
    genresHint: 'حداکثر پنج ژانر',
    originTitle: 'از کدام سینما؟',
    eraTitle: 'کدام دوره؟',
    discoveryTitle: 'چقدر اهل کشف هستی؟',
    discoveryHint: 'از انتخاب‌های مطمئن تا تجربه‌های کمتر دیده‌شده',
    popular: 'محبوب و مطمئن',
    discovery: 'کشف تازه',
    submit: 'نمایش انتخاب‌های من',
    submitting: 'در حال چیدن فهرست…',
    reset: 'شروع دوباره',
    modelNote: 'حال‌وهوا، محتوای فیلم، الگوی کاربران هم‌سلیقه و تنوع فهرست با هم سنجیده می‌شوند.',
    resultEyebrow: 'فهرست اختصاصی تو',
    resultMovieTitle: 'فیلم‌هایی برای همین حال',
    resultSerialTitle: 'سریال‌هایی برای همین حال',
    mediaType: 'دنبال چه چیزی هستی؟',
    movie: 'یک فیلم',
    serial: 'یک سریال',
    summaryMedia: 'نوع پیشنهاد',
  },
  discover: {
    eyebrow: 'آرشیو سینمچ',
    titleStart: 'هر فیلم،',
    titleAccent: 'یک در تازه.',
    description: 'میان دهه‌ها و ژانرها حرکت کن، فیلم موردنظرت را پیدا کن و جزئیاتش را پیش از تماشا ببین.',
    searchPlaceholder: 'مثلاً Interstellar یا جدایی…',
    searchLabel: 'جست‌وجوی فیلم',
    searchAction: 'جست‌وجو',
    filters: 'فیلترها',
    genreLabel: 'فیلتر ژانر',
    allGenres: 'همهٔ ژانرها',
    iranianOnly: 'فقط سینمای ایران',
    clear: 'پاک‌کردن فیلترها',
    clearSearch: 'پاک‌کردن جست‌وجو',
    applyFilters: 'اعمال فیلترها',
    fullCatalog: 'کاتالوگ کامل',
    iranianCatalog: 'کاتالوگ ایران',
    browse: 'مرور فیلم‌ها',
    previous: 'صفحهٔ قبل',
    next: 'صفحهٔ بعد',
    page: (value) => `صفحهٔ ${value}`,
    result: (value) => `نتیجه برای «${value}»`,
    moviesTab: 'فیلم‌ها',
    serialsTab: 'سریال‌ها',
  },
  recommendations: {
    eyebrow: (username) => `برای ${username}`,
    titleStart: 'سلیقه‌ای که',
    titleAccent: 'با تو رشد می‌کند.',
    description: 'هر امتیاز و هر تماشا، تصویر دقیق‌تری از اثری می‌سازد که احتمالاً دوستش خواهی داشت.',
    refresh: 'به‌روزرسانی',
    note: 'متعادل بین سلیقه و تنوع حرکت می‌کند؛ آشنا و مطمئن به انتخاب‌های نزدیک‌تر وزن می‌دهد و کشف تازه تکرار ژانر و دوره را کمتر می‌کند.',
    listEyebrow: 'حالت پیشنهاد',
    listTitle: 'ویژهٔ تو',
    empty: 'برای ساخت پیشنهاد، چند فیلم را امتیاز بده',
    moviesTab: 'پیشنهاد فیلم',
    serialsTab: 'پیشنهاد سریال',
    mediaType: 'نوع پیشنهاد',
  },
  ratings: {
    eyebrow: 'دفترچهٔ تماشا',
    titleStart: 'رد پای',
    titleAccent: 'سلیقهٔ سینمایی تو.',
    description: 'امتیازها پایهٔ پیشنهاد شخصی‌اند؛ هر انتخاب به مدل کمک می‌کند دقیق‌تر تو را بشناسد.',
    aria: (rating) => `امتیاز ${rating} از ۵`,
    outOf: 'از ۵',
    empty: 'هنوز امتیازی ثبت نکرده‌ای',
    emptyText: 'چند فیلم را پیدا کن و امتیاز بده تا پیشنهادهای شخصی فعال شوند.',
    discoverAction: 'رفتن به آرشیو فیلم‌ها',
  },
  auth: {
    eyebrow: 'حساب شخصی',
    titleStart: 'سلیقه‌ات را نگه دار؛',
    titleAccent: 'انتخاب‌ها را بهتر کن.',
    description: 'فقط سه فیلم را امتیاز بده تا پیشنهاد شخصی بر اساس کاربران هم‌سلیقه فعال شود.',
    loginTab: 'ورود',
    registerTab: 'ساخت حساب',
    username: 'نام کاربری',
    usernamePlaceholder: 'مثلاً filmlover…',
    password: 'رمز عبور',
    passwordPlaceholder: 'حداقل ۶ نویسه…', showPassword: 'نمایش گذرواژه', hidePassword: 'پنهان‌کردن گذرواژه', usernameRequired: 'نام کاربری را وارد کنید.', usernameShort: 'نام کاربری باید دست‌کم ۳ نویسه باشد.', passwordRequired: 'گذرواژه را وارد کنید.', passwordShort: 'گذرواژه باید دست‌کم ۶ نویسه باشد.',
    pending: 'کمی صبر کنید…',
    loginAction: 'ورود به سینمچ',
    registerAction: 'ساخت حساب',
    privacy: 'رمز به‌صورت هش‌شده و نشست در cookie امن HttpOnly نگه‌داری می‌شود.',
    benefitsTitle: 'حساب کاربری چه کمکی می‌کند؟',
    benefits: [
      ['پیشنهاد دقیق‌تر', 'یادگیری از امتیازهای واقعی تو'],
      ['تکرار کمتر', 'کنارگذاشتن فیلم‌هایی که دیده‌ای'],
      ['کنترل بیشتر', 'انتخاب میان پیشنهاد متعادل، مطمئن یا اکتشافی'],
    ],
  },
  card: {
    details: 'دیدن جزئیات',
    detailsAria: (title) => `مشاهدهٔ جزئیات ${title}`,
    rate: 'امتیاز',
    match: (value) => `${value}٪ هماهنگی`,
    noOverview: 'خلاصهٔ معتبر این اثر هنوز به کاتالوگ افزوده نشده است.',
    watchlist: 'واچ‌لیست',
    watched: 'دیده‌ام',
    trackSerial: 'شروع پیگیری',
    movie: 'فیلم',
    serial: 'سریال',
  },
  onboarding: {
    eyebrow: 'شروع شخصی‌سازی',
    titleStart: 'سه نشانه برای',
    titleAccent: 'شناخت سلیقهٔ تو.',
    description: 'از میان این دوازده فیلم متنوع، دقیقاً سه مورد را امتیاز بده؛ یا فعلاً از این مرحله عبور کن.',
    progress: (value) => `${value} از ۳ فیلم انتخاب شده`,
    rateAria: (title) => `امتیازدهی به ${title}`,
    picked: (value) => `امتیاز ${value} ثبت می‌شود`,
    saving: 'در حال ساخت نمایه…',
    continue: 'ذخیره و ادامه',
    skip: 'فعلاً رد می‌کنم',
  },
  pwa: {
    offline: 'آفلاین هستید؛ پوسته و فیلم‌های عمومی اخیر در دسترس‌اند.',
    update: 'نسخهٔ تازهٔ سینمچ آماده است.',
    updateAction: 'به‌روزرسانی',
    install: 'نصب سینمچ',
    ios: 'برای نصب در iOS، Share و سپس Add to Home Screen را بزنید.',
  },
  details: {
    back: 'بازگشت به فهرست',
    loadingTitle: 'در حال آماده‌سازی فیلم',
    loading: 'در حال جمع‌آوری اطلاعات فیلم…',
    eyebrow: 'پروندهٔ فیلم',
    matchLabel: 'هماهنگی با انتخاب تو',
    aboutTitle: 'پیش از تماشا بدان',
    experienceTitle: 'فضای فیلم',
    bestForTitle: 'مناسب برای',
    communityTitle: 'نظر جامعهٔ MovieLens',
    rating: 'میانگین امتیاز',
    votes: 'تعداد امتیاز',
    year: 'سال انتشار',
    source: 'منبع اطلاعات',
    noRating: 'بدون امتیاز',
    realData: 'دادهٔ واقعی',
    reasonTitle: 'چرا به تو پیشنهاد شد؟',
    rateAction: 'ثبت امتیاز من',
    similarEyebrow: 'ادامهٔ مسیر',
    similarTitle: 'اگر این فضا را پسندیدی',
    dataTransparency: 'شفافیت داده',
    addWatchlist: 'افزودن به واچ‌لیست',
    markWatched: 'ثبت به‌عنوان دیده‌شده',
    trackSerial: 'پیگیری این سریال',
    seriesProgress: 'پیشرفت سریال',
    episodesWatched: (value) => `${value} قسمت دیده‌شده`, currentStatus: 'وضعیت فعلی', remainingEpisodes: 'قسمت‌های باقی‌مانده', completion: 'درصد تکمیل',
    mediaType: 'نوع اثر',
  },
  ratingDialog: {
    title: 'ثبت امتیاز',
    prompt: (title) => `تجربهٔ تماشای «${title}» چطور بود؟`,
    aria: (value) => `${value} از ۵ ستاره`,
    save: 'ثبت امتیاز',
    saving: 'در حال ثبت…',
  },
  tracker: {
    eyebrow: (username) => `دفتر تماشای ${username}`,
    titleStart: 'هر تماشا،',
    titleAccent: 'یک خانهٔ روشن.',
    description: 'فیلم‌ها، واچ‌لیست و پیشرفت سریال‌ها را یک‌جا نگه دار و ریتم تماشایت را در طول سال ببین.',
    activityTitle: 'فعالیت تماشای یک سال اخیر',
    activityHint: 'هر خانه یک روز است؛ رنگ پرتر یعنی فیلم یا قسمت‌های بیشتری دیده‌ای.',
    activityScrollLabel: 'نمودار فعالیت تماشا؛ برای دیدن روزهای بیشتر افقی پیمایش کنید',
    totalUnits: 'فیلم و قسمت دیده‌شده',
    activeDays: 'روز فعال',
    currentStreak: 'روز پیوستهٔ فعلی',
    longestStreak: 'بیشترین روز پیوسته',
    less: 'کمتر',
    more: 'بیشتر',
    watchlist: 'واچ‌لیست',
    watching: 'در حال تماشا',
    completed: 'دیده‌شده‌ها',
    emptyWatchlist: 'واچ‌لیست هنوز خالی است',
    emptyWatching: 'هنوز سریالی را در حال تماشا ثبت نکرده‌ای',
    emptyCompleted: 'هنوز تماشایی ثبت نشده است',
    findTitles: 'پیدا کردن فیلم و سریال',
    ratingsAction: 'دیدن امتیازهای من',
    updateProgress: 'ثبت پیشرفت',
    remove: 'حذف از دفتر',
    removeTitle: 'حذف از دفتر تماشا',
    removePrompt: (title) => `«${title}» از دفتر تماشا حذف شود؟`,
    removeHint: 'سابقهٔ فعالیت‌های ثبت‌شده پاک نمی‌شود.',
    removeConfirm: 'حذف عنوان',
    removing: 'در حال حذف…',
    progressTitle: 'پیشرفت سریال',
    season: 'فصل فعلی',
    episode: 'قسمت فعلی',
    watchedEpisodes: 'تعداد کل قسمت‌های دیده‌شده',
    saveProgress: 'ذخیرهٔ پیشرفت',
    saving: 'در حال ذخیره…',
    remaining: (value) => `${value} قسمت باقی مانده`,
    unknownRemaining: 'تعداد قسمت‌های باقی‌مانده نامشخص است',
    progress: (value) => `${value}٪ پیشرفت`,
    activityLabel: (date, count) => `${date}: ${count} تماشا`, titleCount: (value) => `${value} عنوان`, emptyText: 'از آرشیو، عنوان دلخواهت را به این بخش اضافه کن.', detailsAria: (title) => `جزئیات ${title}`, serialStatus: 'وضعیت سریال', noticeSaved: 'پیشرفت تماشا ذخیره شد.', noticeRemoved: 'عنوان از دفتر تماشا حذف شد.', noticeEpisodeWatched: 'قسمت بعدی ثبت شد.', nextEpisode: 'ثبت قسمت بعدی', activityAria: (units, days) => `${units} تماشا در ${days} روز`, weekdays: ['ش', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  },
  profile: { account: 'حساب کاربری', title: 'پروفایل من', summary: 'خلاصهٔ تماشا', moviesWatched: 'فیلم دیده‌شده', seriesWatched: 'سریال تمام‌شده', episodesWatched: 'قسمت دیده‌شده', watchlist: 'در واچ‌لیست', ratings: 'امتیاز ثبت‌شده', activeSeries: 'سریال فعال', library: 'کتابخانه و پیشنهادها', ratingsLink: 'امتیازهای من', ratingsDetail: (value) => `${value} امتیاز ثبت‌شده`, trackerLink: 'دفتر تماشا', trackerDetail: (series, watchlist) => `${series} سریال فعال و ${watchlist} عنوان در واچ‌لیست`, recommendationsLink: 'پیشنهادهای من', recommendationsDetail: 'پیشنهادهای متناسب با سلیقه‌ات', session: 'حساب کاربری', signOut: 'خروج از حساب' },
  pageTitles: {
    auth: 'ورود و ثبت‌نام', concierge: 'پیشنهاد هوشمند', detail: 'جزئیات فیلم', discover: 'کشف فیلم', home: 'خانه', onboarding: 'شروع شخصی‌سازی', ratings: 'امتیازهای من', recommendations: 'پیشنهادهای من', tracker: 'دفتر تماشای من', profile: 'پروفایل من',
  },
  common: {
    emptyTitle: 'چیزی پیدا نشد',
    emptyText: 'فیلترها را تغییر بده و دوباره امتحان کن.',
    close: 'بستن', listSeparator: '، ',
    cancel: 'انصراف',
  },
}

const EN_COPY = {
  app: { documentTitle: 'Cinematch | Movie and series recommendations', skipLink: 'Skip to main content', loadingPage: 'Setting the scene...', welcome: 'Welcome, your account is ready.', loggedOut: 'You have been signed out.', ratingSaved: 'Rating saved and your picks are updated.', watchlistSaved: 'Added to your watchlist.', watchedSaved: 'Added to watched.', unknownError: 'Something unexpected went wrong. Please try again.' },
  apiErrors: { network: 'Could not reach the server. Make sure FastAPI is running.', generic: 'Something went wrong with the request. Please try again.' },
  layout: { navLabel: 'Main navigation', brandLabel: 'Cinematch, home', brandStart: 'Cine', brandEnd: 'match', tagline: 'Choose and track movies and series', welcome: 'Welcome', logout: 'Sign out', account: 'Account and watch tracker', login: 'Sign in or create account', footerEyebrow: 'One curtain call, then the next great pick', footerTitle: 'Ready for your next watch?', footerText: 'Cinematch makes choosing a movie faster, more personal, and easier to understand, so your time goes to watching instead of searching.', footerData: 'This product uses the TMDB API but is not endorsed or certified by TMDB. Ratings are from MovieLens.', footerNavLabel: 'Footer links', nowShowing: 'Now showing', languageLabel: 'Language', switchToEnglish: 'Switch to English', switchToPersian: 'Switch to Persian', themeDark: 'Switch to dark theme', themeLight: 'Switch to light theme', themeDarkShort: 'Dark', themeLightShort: 'Light', tmdbLabel: 'TMDB website' },
  home: { eyebrow: 'A movie recommendation made for tonight', titleStart: 'Browse less;', titleAccent: 'watch better.', description: 'Cinematch combines your mood with patterns from thousands of real ratings so your next movie or series is never a random choice.', primaryAction: "Build tonight's picks", secondaryAction: 'Explore the catalog', proof: 'No random guesses · explainable · fast', statsLabel: 'Platform statistics', statMovies: 'movies in the catalog', statSerials: 'series in the catalog', statRatings: 'real ratings', statUsers: 'Cinematch members', statPersian: 'featured Iranian movies', howEyebrow: 'How recommendations work', howTitle: 'Three steps to the right watch', featureOneTitle: 'Tell us your mood', featureOneText: 'A few quick answers turn how you feel right now into useful signals.', featureTwoTitle: 'We weigh thousands of titles', featureTwoText: 'Genres, similarity, and community quality are considered together, not just popularity.', featureThreeTitle: 'We explain the pick', featureThreeText: 'Every recommendation includes a match score and a clear reason, so the final call stays yours.', iranianEyebrow: 'Iranian cinema', iranianTitle: 'A few closer-to-home picks', viewAll: 'View all' },
  concierge: { eyebrow: "Tonight's selection assistant", titleStart: 'Your mood,', titleAccent: 'your movie.', description: 'Choose a primary and optional secondary mood, then get a personal, varied list ready to watch.', progress: 'Five quick choices for tonight\'s list', summaryTitle: "Tonight's choices", summaryHint: 'This summary updates as you make choices.', summaryMood: 'Mood', summaryGenres: 'Genres', summaryOrigin: 'Cinema origin', summaryEra: 'Era', summaryDiscovery: 'Discovery level', noGenres: 'Open to every genre', discoveryValue: (value) => `${value}% adventurous`, moodTitle: 'What do you feel like tonight?', moodHint: 'Choose one primary and, if needed, one secondary mood. Surprise me stands alone.', genresTitle: 'Which worlds draw you in?', genresHint: 'Up to five genres', originTitle: 'From which cinema?', eraTitle: 'Which era?', discoveryTitle: 'How much do you want to explore?', discoveryHint: 'From dependable favorites to less-seen experiences', popular: 'Popular and dependable', discovery: 'Explore more', submit: 'Show my picks', submitting: 'Curating your list...', reset: 'Start over', modelNote: 'We consider mood, movie content, like-minded viewers, and list variety together.', resultEyebrow: 'Your personal list', resultMovieTitle: 'Movies for this mood', resultSerialTitle: 'Series for this mood', mediaType: 'What are you looking for?', movie: 'A movie', serial: 'A series', summaryMedia: 'Recommendation type' },
  discover: { eyebrow: 'The Cinematch catalog', titleStart: 'Every title,', titleAccent: 'a new door.', description: 'Move through decades and genres, find what you want, and see the details before watching.', searchPlaceholder: 'Try Interstellar or A Separation...', searchLabel: 'Search movies', searchAction: 'Search', filters: 'Filters', genreLabel: 'Genre filter', allGenres: 'All genres', iranianOnly: 'Iranian cinema only', clear: 'Clear filters', clearSearch: 'Clear search', applyFilters: 'Apply filters', fullCatalog: 'Full catalog', iranianCatalog: 'Iranian catalog', browse: 'Browse titles', previous: 'Previous page', next: 'Next page', page: (value) => `Page ${value}`, result: (value) => `Results for “${value}”`, moviesTab: 'Movies', serialsTab: 'Series', mediaType: 'Content type' },
  recommendations: { eyebrow: (username) => `For ${username}`, titleStart: 'A taste that', titleAccent: 'grows with you.', description: 'Every rating and watch gives us a sharper picture of what you are likely to enjoy.', refresh: 'Refresh', note: 'Balanced blends taste and variety. Familiar favors nearby choices, while Explore more reduces repeated genres and eras.', listEyebrow: 'Recommendation mode', listTitle: 'Picked for you', empty: 'Rate a few movies to build recommendations', moviesTab: 'Movie picks', serialsTab: 'Series picks', mediaType: 'Recommendation type' },
  ratings: { eyebrow: 'Your watch journal', titleStart: 'A trail of your', titleAccent: 'cinematic taste.', description: 'Ratings power personal picks. Every choice helps the model know you better.', aria: (rating) => `Rating ${rating} out of 5`, outOf: 'out of 5', empty: 'You have not rated anything yet', emptyText: 'Find and rate a few movies to unlock personal picks.', discoverAction: 'Explore the movie catalog' },
  auth: { eyebrow: 'Your account', titleStart: 'Keep your taste;', titleAccent: 'improve every pick.', description: 'Rate just three movies to enable personal picks based on people with similar taste.', loginTab: 'Sign in', registerTab: 'Create account', username: 'Username', usernamePlaceholder: 'For example, filmlover...', password: 'Password', passwordPlaceholder: 'At least 6 characters...', pending: 'One moment...', loginAction: 'Sign in to Cinematch', registerAction: 'Create account', privacy: 'Your password is hashed and your session is kept in a secure HttpOnly cookie.', benefitsTitle: 'What does an account unlock?', benefits: [['Better picks', 'Learn from your real ratings'], ['Less repetition', 'Set aside titles you have already watched'], ['More control', 'Choose balanced, familiar, or exploratory picks']], showPassword: 'Show password', hidePassword: 'Hide password', usernameRequired: 'Enter your username.', usernameShort: 'Your username must be at least 3 characters.', passwordRequired: 'Enter your password.', passwordShort: 'Your password must be at least 6 characters.' },
  card: { details: 'View details', detailsAria: (title) => `View details for ${title}`, rate: 'Rate', match: (value) => `${value}% match`, noOverview: 'A verified summary is not available for this title yet.', watchlist: 'Watchlist', watched: 'Watched', trackSerial: 'Track series', movie: 'Movie', serial: 'Series' },
  onboarding: { eyebrow: 'Start personalizing', titleStart: 'Three signals to', titleAccent: 'learn your taste.', description: 'Rate exactly three of these twelve varied movies, or skip this step for now.', progress: (value) => `${value} of 3 movies selected`, rateAria: (title) => `Rate ${title}`, picked: (value) => `Rated ${value}`, saving: 'Building your profile...', continue: 'Save and continue', skip: 'Skip for now' },
  pwa: { offline: 'You are offline. The app shell and recent public movies are still available.', update: 'A new version of Cinematch is ready.', updateAction: 'Update', install: 'Install Cinematch', ios: 'To install on iOS, use Share, then Add to Home Screen.' },
  details: { back: 'Back to list', loadingTitle: 'Preparing movie', loading: 'Gathering movie details...', eyebrow: 'Title file', matchLabel: 'Match for your selection', aboutTitle: 'Know before watching', experienceTitle: 'The atmosphere', bestForTitle: 'Best for', communityTitle: 'MovieLens community note', rating: 'Average rating', votes: 'Rating count', year: 'Release year', source: 'Data source', noRating: 'No rating', realData: 'Live data', reasonTitle: 'Why this was recommended', rateAction: 'Rate it', similarEyebrow: 'Keep exploring', similarTitle: 'If you liked this atmosphere', dataTransparency: 'Data transparency', addWatchlist: 'Add to watchlist', markWatched: 'Mark as watched', trackSerial: 'Track this series', seriesProgress: 'Series progress', episodesWatched: (value) => `${value} episodes watched`, currentStatus: 'Current status', remainingEpisodes: 'Episodes remaining', completion: 'Completion', mediaType: 'Title type' },
  ratingDialog: { title: 'Rate this title', prompt: (title) => `How was watching “${title}”?`, aria: (value) => `${value} out of 5 stars`, save: 'Save rating', saving: 'Saving...' },
  tracker: { eyebrow: (username) => `${username}'s watch tracker`, titleStart: 'Every watch,', titleAccent: 'a brighter square.', description: 'Keep movies, watchlists, and series progress in one place, then see your viewing rhythm across the year.', activityTitle: 'Watching activity over the last year', activityHint: 'Each square is a day. A fuller color means more movies or episodes watched.', activityScrollLabel: 'Watch activity chart. Scroll horizontally to view more days.', totalUnits: 'movies and episodes watched', activeDays: 'active days', currentStreak: 'current streak', longestStreak: 'longest streak', less: 'Less', more: 'More', watchlist: 'Watchlist', watching: 'Current series', completed: 'Watch history', emptyWatchlist: 'Your watchlist is empty', emptyWatching: 'You have not marked a series as watching yet', emptyCompleted: 'No watches recorded yet', findTitles: 'Find movies and series', ratingsAction: 'View my ratings', updateProgress: 'Update progress', remove: 'Remove from tracker', removeTitle: 'Remove from watch tracker', removePrompt: (title) => `Remove “${title}” from your watch tracker?`, removeHint: 'Your recorded activity history will remain.', removeConfirm: 'Remove title', removing: 'Removing...', progressTitle: 'Series progress', season: 'Current season', episode: 'Current episode', watchedEpisodes: 'Total episodes watched', saveProgress: 'Save progress', saving: 'Saving...', remaining: (value) => `${value} episodes remaining`, unknownRemaining: 'Remaining episode count is unknown', progress: (value) => `${value}% complete`, activityLabel: (date, count) => `${date}: ${count} watches`, titleCount: (value) => `${value} titles`, emptyText: 'Add a title from the catalog to see it here.', serialStatus: 'Series status', noticeSaved: 'Watch progress saved.', noticeRemoved: 'Title removed from your watch tracker.', noticeEpisodeWatched: 'Next episode marked watched.', nextEpisode: 'Mark next episode watched', activityAria: (units, days) => `${units} watches across ${days} days`, weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], detailsAria: (title) => `Details for ${title}` },
  profile: { account: 'Account', title: 'Your profile', summary: 'Your watch summary', moviesWatched: 'movies watched', seriesWatched: 'series finished', episodesWatched: 'episodes watched', watchlist: 'on your watchlist', ratings: 'ratings', activeSeries: 'current series', library: 'Library and recommendations', ratingsLink: 'My ratings', ratingsDetail: (value) => `${value} ratings`, trackerLink: 'My watch tracker', trackerDetail: (series, watchlist) => `${series} current series and ${watchlist} watchlist titles`, recommendationsLink: 'My recommendations', recommendationsDetail: 'Picks shaped by your taste', session: 'Account', signOut: 'Sign out' },
  pageTitles: { auth: 'Sign in', concierge: 'Pick for me', detail: 'Movie details', discover: 'Discover titles', home: 'Home', onboarding: 'Start personalizing', ratings: 'My ratings', recommendations: 'My recommendations', tracker: 'My watch tracker', profile: 'My profile' },
  common: { emptyTitle: 'Nothing found', emptyText: 'Change the filters and try again.', close: 'Close', cancel: 'Cancel', listSeparator: ', ' },
}

let currentCopy = EN_COPY

export const COPY = new Proxy({}, { get: (_, property) => currentCopy[property] })

export function setCopyLocale(locale) {
  currentCopy = locale === 'fa' ? FA_COPY : EN_COPY
  const labels = locale === 'fa' ? FA_GENRE_LABELS : EN_GENRE_LABELS
  const genreOptions = Object.entries(labels).filter(([key]) => key !== '(no genres listed)')
  Object.assign(GENRE_LABELS, labels)
  GENRE_OPTIONS.splice(0, GENRE_OPTIONS.length, ...genreOptions)
  NAV_ITEMS.splice(0, NAV_ITEMS.length, ...(locale === 'fa' ? FA_NAV_ITEMS : EN_NAV_ITEMS))
  MOOD_OPTIONS.splice(0, MOOD_OPTIONS.length, ...(locale === 'fa' ? FA_MOOD_OPTIONS : EN_MOOD_OPTIONS))
  ERA_OPTIONS.splice(0, ERA_OPTIONS.length, ...(locale === 'fa' ? FA_ERA_OPTIONS : EN_ERA_OPTIONS))
  ORIGIN_OPTIONS.splice(0, ORIGIN_OPTIONS.length, ...(locale === 'fa' ? FA_ORIGIN_OPTIONS : EN_ORIGIN_OPTIONS))
  MODE_OPTIONS.splice(0, MODE_OPTIONS.length, ...(locale === 'fa' ? FA_MODE_OPTIONS : EN_MODE_OPTIONS))
}

setCopyLocale('en')
