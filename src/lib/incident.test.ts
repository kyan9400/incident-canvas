import { describe, expect, it } from 'vitest'
import { sampleIncident } from '../data/sample'
import { blankIncident, calculateMetrics, formatDuration, parseIncident, toMarkdown } from './incident'

describe('calculateMetrics', () => {
  it('calculates response time and action completion', () => {
    expect(calculateMetrics(sampleIncident)).toEqual({
      durationMinutes: 55,
      detectionMinutes: 7,
      completionPercent: 33,
    })
  })

  it('handles missing and reversed timestamps', () => {
    expect(calculateMetrics({
      ...sampleIncident,
      detectedAt: '',
      resolvedAt: '2026-08-14T08:00',
      actionItems: [],
    })).toEqual({ durationMinutes: null, detectionMinutes: null, completionPercent: 0 })
  })
})

describe('formatDuration', () => {
  it('formats minutes and hours compactly', () => {
    expect(formatDuration(7)).toBe('7m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(125)).toBe('2h 5m')
    expect(formatDuration(null)).toBe('—')
  })
})

describe('parseIncident', () => {
  it('normalizes imported values and rejects unsupported files', () => {
    const parsed = parseIncident({
      ...sampleIncident,
      severity: 'SEV-99',
      status: 'unknown',
      actionItems: [{ task: 'Test rollback', status: 'unexpected' }],
    })
    expect(parsed.severity).toBe('SEV-3')
    expect(parsed.status).toBe('investigating')
    expect(parsed.actionItems[0].status).toBe('open')
    expect(() => parseIncident({ ...sampleIncident, schemaVersion: 2 })).toThrow(/schema version/)
    expect(() => parseIncident({ ...sampleIncident, title: '' })).toThrow(/title/)
  })
})

describe('toMarkdown', () => {
  it('creates a portable postmortem with metrics, timeline, and actions', () => {
    const report = toMarkdown(sampleIncident)
    expect(report).toContain('# INC-2026-0814: Checkout requests stalled')
    expect(report).toContain('**Detection gap:** 7m')
    expect(report).toContain('**Time to recovery:** 55m')
    expect(report).toContain('Pool saturation identified')
    expect(report).toContain('| ✓ | Release database connections')
  })
})

describe('blankIncident', () => {
  it('starts a valid, empty report', () => {
    const incident = blankIncident()
    expect(incident.schemaVersion).toBe(1)
    expect(incident.title).toBe('Untitled incident')
    expect(incident.timeline).toEqual([])
    expect(incident.actionItems).toEqual([])
  })
})
