import { useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeSlash, LockKey as LockKeyhole, UserCircle as UserRound } from '@phosphor-icons/react'
import { api } from '../api'
import { ErrorMessage, Hero, SpinnerLabel } from '../components/UI'
import { COPY } from '../constants/copy'

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)

  const validateField = (name, value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return name === 'username' ? 'نام کاربری را وارد کنید.' : 'گذرواژه را وارد کنید.'
    if (name === 'username' && trimmedValue.length < 3) return 'نام کاربری باید دست‌کم ۳ نویسه باشد.'
    if (name === 'password' && value.length < 6) return 'گذرواژه باید دست‌کم ۶ نویسه باشد.'
    return ''
  }

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: validateField(name, value) }))
  }

  const validateForm = () => {
    const nextErrors = {
      username: validateField('username', form.username),
      password: validateField('password', form.password),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.username) usernameRef.current?.focus()
    else if (nextErrors.password) passwordRef.current?.focus()
    return !nextErrors.username && !nextErrors.password
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!validateForm()) return
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
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="segmented">
            <button type="button" aria-pressed={mode === 'login'} className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError('') }}>{COPY.auth.loginTab}</button>
            <button type="button" aria-pressed={mode === 'register'} className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError('') }}>{COPY.auth.registerTab}</button>
          </div>
          <label><span><UserRound size={17} aria-hidden="true" />{COPY.auth.username}</span><input ref={usernameRef} required name="username" minLength="3" maxLength="50" autoComplete="username" spellCheck={false} value={form.username} onChange={(event) => updateField('username', event.target.value)} onBlur={(event) => setFieldErrors((current) => ({ ...current, username: validateField('username', event.target.value) }))} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'username-error' : undefined} placeholder={COPY.auth.usernamePlaceholder} />{fieldErrors.username ? <small id="username-error" className="field-error" role="alert">{fieldErrors.username}</small> : null}</label>
          <div className="field-group"><label htmlFor="auth-password"><span><LockKeyhole size={17} aria-hidden="true" />{COPY.auth.password}</span></label><span className="password-field"><input ref={passwordRef} id="auth-password" required name="password" minLength="6" maxLength="100" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => updateField('password', event.target.value)} onBlur={(event) => setFieldErrors((current) => ({ ...current, password: validateField('password', event.target.value) }))} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} placeholder={COPY.auth.passwordPlaceholder} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'پنهان‌کردن گذرواژه' : 'نمایش گذرواژه'} aria-pressed={showPassword}>{showPassword ? <EyeSlash size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button></span>{fieldErrors.password ? <small id="password-error" className="field-error" role="alert">{fieldErrors.password}</small> : null}</div>
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
