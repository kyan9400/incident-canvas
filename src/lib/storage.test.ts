import { beforeEach, describe, expect, it } from 'vitest'
import { sampleIncident } from '../data/sample'
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  createArchive,
  loadArchive,
  mergeArchives,
  parseArchive,
  saveArchive,
} from './storage'

describe('incident archive storage', () => {
  beforeEach(() => localStorage.clear())

  it('stores a versioned archive', () => {
    const archive = createArchive(sampleIncident)

    expect(saveArchive(archive)).toBe(true)
    expect(loadArchive(sampleIncident)).toEqual(archive)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(archive)
  })

  it('migrates the previous single-incident storage key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(sampleIncident))

    const archive = loadArchive({ ...sampleIncident, id: 'fallback' })

    expect(archive.schemaVersion).toBe(2)
    expect(archive.activeIncidentId).toBe(sampleIncident.id)
    expect(archive.incidents).toEqual([sampleIncident])
  })

  it('merges imported incidents by identifier', () => {
    const current = createArchive(sampleIncident)
    const updated = { ...sampleIncident, title: 'Updated title' }
    const second = { ...sampleIncident, id: 'INC-SECOND', title: 'Second incident' }
    const incoming = {
      schemaVersion: 2 as const,
      activeIncidentId: second.id,
      incidents: [updated, second],
    }

    const result = mergeArchives(current, incoming)

    expect(result.activeIncidentId).toBe('INC-SECOND')
    expect(result.incidents).toHaveLength(2)
    expect(result.incidents.find((incident) => incident.id === sampleIncident.id)?.title).toBe('Updated title')
  })

  it('rejects empty, oversized, and duplicate archives', () => {
    expect(() => parseArchive({ schemaVersion: 2, incidents: [] })).toThrow(/at least one/)
    expect(() => parseArchive({
      schemaVersion: 2,
      incidents: [sampleIncident, sampleIncident],
      activeIncidentId: sampleIncident.id,
    })).toThrow(/unique/)
  })
})
