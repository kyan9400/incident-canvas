import type { Incident, IncidentArchive } from '../types'
import { parseIncident } from './incident'

export const STORAGE_KEY = 'incident-canvas:v2'
export const LEGACY_STORAGE_KEY = 'incident-canvas:v1'
const MAX_INCIDENTS = 50

export function createArchive(incident: Incident): IncidentArchive {
  return { schemaVersion: 2, activeIncidentId: incident.id, incidents: [incident] }
}

export function parseArchive(value: unknown): IncidentArchive {
  if (!value || typeof value !== 'object') {
    throw new Error('The file does not contain an incident archive.')
  }
  const input = value as Record<string, unknown>
  if (input.schemaVersion !== 2) {
    throw new Error('This archive uses an unsupported schema version.')
  }
  if (!Array.isArray(input.incidents) || input.incidents.length < 1) {
    throw new Error('An archive must contain at least one incident.')
  }
  if (input.incidents.length > MAX_INCIDENTS) {
    throw new Error(`An archive can contain at most ${MAX_INCIDENTS} incidents.`)
  }
  const incidents = input.incidents.map(parseIncident)
  const ids = incidents.map((incident) => incident.id)
  if (new Set(ids).size !== ids.length) throw new Error('Incident identifiers must be unique.')
  const activeIncidentId = typeof input.activeIncidentId === 'string'
    ? input.activeIncidentId
    : incidents[0].id
  return {
    schemaVersion: 2,
    activeIncidentId: ids.includes(activeIncidentId) ? activeIncidentId : incidents[0].id,
    incidents,
  }
}

export function mergeArchives(
  current: IncidentArchive,
  incoming: IncidentArchive,
): IncidentArchive {
  const merged = new Map(current.incidents.map((incident) => [incident.id, incident]))
  for (const incident of incoming.incidents) merged.set(incident.id, incident)
  const incidents = [...merged.values()]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_INCIDENTS)
  return {
    schemaVersion: 2,
    activeIncidentId: incidents.some((incident) => incident.id === incoming.activeIncidentId)
      ? incoming.activeIncidentId
      : incidents[0].id,
    incidents,
  }
}

export function loadArchive(fallback: Incident): IncidentArchive {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return parseArchive(JSON.parse(stored))
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) return createArchive(parseIncident(JSON.parse(legacy)))
  } catch {
    // A malformed or unavailable store should never prevent the editor from opening.
  }
  return createArchive(fallback)
}

export function saveArchive(archive: IncidentArchive): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archive))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
