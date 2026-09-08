import { useState } from 'react'
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react'
import { api } from '../api'
import { ErrorMessage, Hero, SpinnerLabel } from '../components/UI'

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { onAuthenticated(await (mode === 'login' ? api.login(form.username, form.password) : api.register(form.username, form.password))) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  return <>
    <Hero variant="compact-hero auth-hero" eyebrow="حساب شخصی" title={<>سلیقه‌ات را ذخیره کن؛<br/><em>پیشنهادها را بهتر کن.</em></>} description="با امتیاز دادن به فقط سه فیلم، پیشنهادهای شخصی بر اساس کاربران هم‌سلیقه فعال می‌شوند." />
    <div className="auth-layout"><form className="auth-card" onSubmit={submit}><div className="segmented"><button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>ورود</button><button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => setMode('register')}>ساخت حساب</button></div><label><span><UserRound size={17}/> نام کاربری</span><input required minLength="3" maxLength="50" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username:e.target.value })} placeholder="مثلاً filmlover"/></label><label><span><LockKeyhole size={17}/> رمز عبور</span><input required minLength="6" maxLength="100" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password:e.target.value })} placeholder="حداقل ۶ نویسه"/></label>{error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary large" disabled={loading}>{loading ? <SpinnerLabel>کمی صبر کنید…</SpinnerLabel> : <>{mode === 'login' ? 'ورود به سینمچ' : 'ساخت حساب'} <ArrowLeft size={18}/></>}</button><small className="privacy">رمز عبور به‌صورت هش‌شده ذخیره می‌شود و متن آن قابل بازیابی نیست.</small></form><aside className="auth-benefits"><h2>حساب کاربری چه کمکی می‌کند؟</h2><ul><li><b>پیشنهاد دقیق‌تر</b><span>یادگیری از امتیازهای واقعی تو</span></li><li><b>حذف فیلم‌های دیده‌شده</b><span>تکرار کمتر در پیشنهادها</span></li><li><b>مقایسه مدل‌ها</b><span>ترکیبی، محتوایی و هم‌سلیقه‌ها</span></li></ul></aside></div>
  </>
}
