import { BrainCircuit, Clapperboard, Compass, Heart, Home, LogIn, Star, UserRound } from 'lucide-react'

const NAV = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'concierge', label: 'پیشنهاد هوشمند', icon: BrainCircuit },
  { id: 'discover', label: 'کشف فیلم', icon: Compass },
  { id: 'recommendations', label: 'ویژهٔ من', icon: Heart, auth: true },
  { id: 'ratings', label: 'امتیازهای من', icon: Star, auth: true },
]

function Navigation({ page, setPage, user }) {
  const visible = NAV.filter((item) => !item.auth || user)
  return <nav className="nav" aria-label="منوی اصلی">
    {visible.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span></button>)}
  </nav>
}

export default function Layout({ children, page, setPage, user, logout }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('home')} aria-label="سینمچ، صفحه اصلی">
        <span className="brand-mark"><Clapperboard size={25} /></span>
        <span><strong>سین</strong>مچ<small>پیشنهاد هوشمند فیلم</small></span>
      </button>
      <Navigation page={page} setPage={setPage} user={user} />
      <div className="sidebar-footer">
        {user ? <>
          <div className="user-chip"><span><UserRound size={18} /></span><div><small>خوش آمدی</small><strong>{user.username}</strong></div></div>
          <button className="text-button" onClick={logout}>خروج از حساب</button>
        </> : <button className="login-cta" onClick={() => setPage('auth')}><LogIn size={18} /> ورود یا ثبت‌نام</button>}
      </div>
    </aside>
    <main id="main-content" className="main-content">{children}</main>
    <div className="mobile-nav"><Navigation page={page} setPage={setPage} user={user} /></div>
  </div>
}
