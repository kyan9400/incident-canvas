import type { Incident } from '../types'
import { parseIncident } from './incident'

export const STORAGE_KEY = 'incident-canvas:v1'

export function loadIncident(fallback: Incident): Incident {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseIncident(JSON.parse(stored)) : fallback
  } catch {
    return fallback
  }
}

export function saveIncident(incident: Incident): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incident))
    return true
  } catch {
    return false
  }
}
