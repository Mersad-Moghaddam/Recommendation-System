import { useEffect, useState } from 'react'

const listeners = new Set()

export function announceDataChange(...topics) {
  listeners.forEach((listener) => listener(new Set(topics)))
}

export function useDataRevision(...topics) {
  const [revision, setRevision] = useState(0)
  const topicKey = topics.join('|')
  useEffect(() => {
    const subscribedTopics = topicKey.split('|')
    const listener = (changed) => {
      if (subscribedTopics.some((topic) => changed.has(topic))) setRevision((value) => value + 1)
    }
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [topicKey])
  return revision
}

export function createMutationId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
