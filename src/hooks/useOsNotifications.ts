import { useEffect, useRef } from 'react'
import type { Notification } from '@/lib/types'
import { soundSynthesizer } from '@/lib/sound'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'

let permissionRequested = false

async function requestPermissionOnce() {
  if (permissionRequested) return
  permissionRequested = true
  if (!window.Notification || Notification.permission === 'denied') return
  if (Notification.permission === 'granted') return
  await Notification.requestPermission()
}

const MAX_SHOWN = 100

export function useOsNotifications(notifications: Notification[]) {
  const shownRef = useRef(new Set<string>())

  useEffect(() => {
    requestPermissionOnce()
  }, [])

  useEffect(() => {
    if (shownRef.current.size > MAX_SHOWN) {
      shownRef.current = new Set([...shownRef.current].slice(-MAX_SHOWN))
    }
    
    const now = Date.now()
    const preferences = useUserPreferencesStore.getState().preferences
    let playedSound = false

    notifications.forEach(n => {
      if (n.read) return
      if (shownRef.current.has(n.id)) return
      const age = now - new Date(n.createdAt).getTime()
      if (age > 10000) return
      shownRef.current.add(n.id)

      if (Notification.permission === 'granted') {
        new Notification(n.title, { body: n.message })
      }

      if (preferences?.enableSoundNotif && !playedSound) {
        soundSynthesizer.play(preferences.soundNotifTheme, preferences.soundNotifVolume)
        playedSound = true
      }
    })
  }, [notifications])
}
