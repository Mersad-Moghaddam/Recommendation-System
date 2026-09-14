import { useCallback, useEffect, useState } from 'react'
import { COPY } from '../constants/copy'

export function useFeedback() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])
  const showError = useCallback((error) => setToast({ message: error?.message || COPY.app.unknownError, type: 'error' }), [])
  const showSuccess = useCallback((message) => setToast({ message, type: 'success' }), [])
  return { toast, showError, showSuccess }
}
