import { ViewTransition } from 'react'

const ENTER_CLASSES = {
  'nav-forward': 'slide-from-left',
  'nav-back': 'slide-from-right',
  'nav-lateral': 'fade-in',
  default: 'none',
}

const EXIT_CLASSES = {
  'nav-forward': 'slide-to-right',
  'nav-back': 'slide-to-left',
  'nav-lateral': 'fade-out',
  default: 'none',
}

export default function PageTransition({ children }) {
  return (
    <ViewTransition enter={ENTER_CLASSES} exit={EXIT_CLASSES} default="none">
      <div className="page-stage">{children}</div>
    </ViewTransition>
  )
}
