import { useEffect, useState } from 'react'
import { ArrowLeft, BrainCircuit, Database, Film, Sparkles, Users } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { Hero, SectionTitle } from '../components/UI'
import { faNumber } from '../utils'

export default function Home({ setPage, user, onRate, onSimilar, showError }) {
  const [stats, setStats] = useState(null)
  const [iranian, setIranian] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([api.stats(), api.movies({ iranian: true, limit: 6 })])
      .then(([nextStats, movies]) => { setStats(nextStats); setIranian(movies) })
      .catch(showError).finally(() => setLoading(false))
  }, [showError])
  return <>
    <Hero eyebrow="سینمای امشب، دقیق‌تر از همیشه" title={<>فیلمی پیدا کن که<br/><em>واقعاً به حالت بخورد.</em></>} description="سینمچ از سلیقه، حال‌وهوا و الگوی امتیاز کاربران واقعی یاد می‌گیرد؛ شفاف، سریع و بدون حدس‌های تصادفی.">
      <button className="button primary" onClick={() => setPage('concierge')}><BrainCircuit size={19}/> شروع پیشنهاد هوشمند</button>
      <button className="button ghost" onClick={() => setPage('discover')}>دیدن آرشیو <ArrowLeft size={18}/></button>
    </Hero>
    <section className="stats-strip" aria-label="آمار سامانه">
      <Stat icon={Film} value={stats?.movies} label="فیلم در آرشیو" />
      <Stat icon={Database} value={stats?.ratings} label="امتیاز واقعی" />
      <Stat icon={Users} value={stats?.users} label="عضو سینمچ" />
      <Stat icon={Sparkles} value={stats?.persian_movies} label="فیلم ایرانی منتخب" />
    </section>
    <section className="how-section">
      <SectionTitle eyebrow="هوش مصنوعی توضیح‌پذیر" title="چرا این پیشنهاد برای من است؟" />
      <div className="feature-grid">
        <Feature number="۱" title="حالت را می‌فهمد" text="پاسخ‌های کوتاه تو را به یک بردار سلیقهٔ قابل محاسبه تبدیل می‌کند." />
        <Feature number="۲" title="شباهت را پیدا می‌کند" text="با TF–IDF و شباهت کسینوسی، هزاران فیلم واقعی را مقایسه می‌کند." />
        <Feature number="۳" title="با تو بهتر می‌شود" text="با هر امتیاز، الگوی کاربران هم‌سلیقه و ژانرهای محبوبت دقیق‌تر می‌شوند." />
      </div>
    </section>
    <section>
      <SectionTitle eyebrow="پیشنهاد ویژه" title="از سینمای ایران" action={<button className="link-button" onClick={() => setPage('discover')}>مشاهده همه <ArrowLeft size={16}/></button>} />
      <MovieGrid movies={iranian} loading={loading} user={user} onRate={onRate} onSimilar={onSimilar} compact />
    </section>
  </>
}

function Stat({ icon: Icon, value, label }) { return <div className="stat"><Icon size={21}/><div><strong>{value == null ? '…' : faNumber(Number(value).toLocaleString('fa-IR'))}</strong><span>{label}</span></div></div> }
function Feature({ number, title, text }) { return <article className="feature-card"><span>{number}</span><h3>{title}</h3><p>{text}</p></article> }
