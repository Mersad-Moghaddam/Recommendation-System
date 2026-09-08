import { useState } from 'react'
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react'
import { api } from '../api'
import { ErrorMessage, Hero, SpinnerLabel } from '../components/UI'
import { COPY } from '../constants/copy'

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authenticate = mode === 'login' ? api.login : api.register
      onAuthenticated(await authenticate(form.username, form.password))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Hero className="compact-hero auth-hero" eyebrow={COPY.auth.eyebrow} title={<>{COPY.auth.titleStart}<br /><em>{COPY.auth.titleAccent}</em></>} description={COPY.auth.description} />
      <div className="auth-layout">
        <form className="auth-card" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>{COPY.auth.loginTab}</button>
            <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => setMode('register')}>{COPY.auth.registerTab}</button>
          </div>
          <label><span><UserRound size={17} aria-hidden="true" />{COPY.auth.username}</span><input required name="username" minLength="3" maxLength="50" autoComplete="username" spellCheck={false} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder={COPY.auth.usernamePlaceholder} /></label>
          <label><span><LockKeyhole size={17} aria-hidden="true" />{COPY.auth.password}</span><input required name="password" minLength="6" maxLength="100" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={COPY.auth.passwordPlaceholder} /></label>
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <button type="submit" className="button primary large" disabled={loading}>
            {loading ? <SpinnerLabel>{COPY.auth.pending}</SpinnerLabel> : <>{mode === 'login' ? COPY.auth.loginAction : COPY.auth.registerAction}<ArrowLeft size={18} aria-hidden="true" /></>}
          </button>
          <small className="privacy">{COPY.auth.privacy}</small>
        </form>
        <aside className="auth-benefits">
          <h2>{COPY.auth.benefitsTitle}</h2>
          <ul>{COPY.auth.benefits.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ul>
        </aside>
      </div>
    </>
  )
}
