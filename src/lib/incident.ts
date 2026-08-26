import type {
  ActionItem,
  ActionStatus,
  Incident,
  IncidentMetrics,
  IncidentStatus,
  Severity,
  TimelineEvent,
} from '../types'

const severities: Severity[] = ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4']
const statuses: IncidentStatus[] = ['investigating', 'monitoring', 'resolved']
const actionStatuses: ActionStatus[] = ['open', 'in_progress', 'done']

export function createId(prefix: string): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `${prefix}-${suffix}`
}

function minutesBetween(start: string, end: string): number | null {
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  return Math.round((endMs - startMs) / 60_000)
}

export function calculateMetrics(incident: Incident): IncidentMetrics {
  const completed = incident.actionItems.filter((item) => item.status === 'done').length
  return {
    durationMinutes: incident.resolvedAt
      ? minutesBetween(incident.startedAt, incident.resolvedAt)
      : null,
    detectionMinutes: minutesBetween(incident.startedAt, incident.detectedAt),
    completionPercent: incident.actionItems.length
      ? Math.round((completed / incident.actionItems.length) * 100)
      : 0,
  }
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function formatTimestamp(value: string): string {
  if (!value) return 'Time pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, 10_000) : fallback
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 500))
}

function safeTimeline(value: unknown): TimelineEvent[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 200).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const item = entry as Record<string, unknown>
    return [{
      id: safeText(item.id, createId('event')),
      at: safeText(item.at),
      label: safeText(item.label, 'Untitled event'),
      note: safeText(item.note),
    }]
  })
}

function safeActions(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 200).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const item = entry as Record<string, unknown>
    const status = actionStatuses.includes(item.status as ActionStatus)
      ? (item.status as ActionStatus)
      : 'open'
    return [{
      id: safeText(item.id, createId('action')),
      task: safeText(item.task, 'Untitled action'),
      owner: safeText(item.owner),
      due: safeText(item.due),
      status,
    }]
  })
}

export function parseIncident(value: unknown): Incident {
  if (!value || typeof value !== 'object') throw new Error('The file does not contain an incident object.')
  const input = value as Record<string, unknown>
  if (input.schemaVersion !== 1) throw new Error('This incident file uses an unsupported schema version.')
  const title = safeText(input.title)
  if (!title.trim()) throw new Error('The incident needs a title.')

  return {
    schemaVersion: 1,
    id: safeText(input.id, 'INC-UNTITLED'),
    title,
    summary: safeText(input.summary),
    severity: severities.includes(input.severity as Severity) ? (input.severity as Severity) : 'SEV-3',
    status: statuses.includes(input.status as IncidentStatus)
      ? (input.status as IncidentStatus)
      : 'investigating',
    services: safeStringArray(input.services),
    startedAt: safeText(input.startedAt),
    detectedAt: safeText(input.detectedAt),
    resolvedAt: safeText(input.resolvedAt),
    impact: safeText(input.impact),
    rootCause: safeText(input.rootCause),
    resolution: safeText(input.resolution),
    contributingFactors: safeStringArray(input.contributingFactors),
    timeline: safeTimeline(input.timeline),
    actionItems: safeActions(input.actionItems),
    updatedAt: safeText(input.updatedAt, new Date().toISOString()),
  }
}

function markdownList(items: string[], empty: string): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : `- ${empty}`
}

export function toMarkdown(incident: Incident): string {
  const metrics = calculateMetrics(incident)
  const timeline = [...incident.timeline]
    .sort((left, right) => left.at.localeCompare(right.at))
    .map((event) => `- **${formatTimestamp(event.at)} — ${event.label}:** ${event.note}`)
    .join('\n')
  const actions = incident.actionItems
    .map((item) => `| ${item.status === 'done' ? '✓' : '○'} | ${item.task} | ${item.owner || 'Unassigned'} | ${item.due || '—'} | ${item.status.replace('_', ' ')} |`)
    .join('\n')

  return `# ${incident.id}: ${incident.title}

**Severity:** ${incident.severity}  
**Status:** ${incident.status}  
**Services:** ${incident.services.join(', ') || 'Not recorded'}  
**Started:** ${formatTimestamp(incident.startedAt)}  
**Detected:** ${formatTimestamp(incident.detectedAt)}  
**Resolved:** ${formatTimestamp(incident.resolvedAt)}  
**Detection gap:** ${formatDuration(metrics.detectionMinutes)}  
**Time to recovery:** ${formatDuration(metrics.durationMinutes)}

## Summary

${incident.summary || 'Not recorded.'}

## Impact

${incident.impact || 'Not recorded.'}

## Timeline

${timeline || '- No events recorded.'}

## Root cause

${incident.rootCause || 'Not recorded.'}

## Contributing factors

${markdownList(incident.contributingFactors, 'None recorded.')}

## Resolution

${incident.resolution || 'Not recorded.'}

## Follow-up actions

|  | Action | Owner | Due | Status |
|---|---|---|---|---|
${actions || '|  | No actions recorded | — | — | — |'}
`
}

export function blankIncident(): Incident {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  return {
    schemaVersion: 1,
    id: `INC-${now.getFullYear()}-NEW`,
    title: 'Untitled incident',
    summary: '',
    severity: 'SEV-3',
    status: 'investigating',
    services: [],
    startedAt: local,
    detectedAt: '',
    resolvedAt: '',
    impact: '',
    rootCause: '',
    resolution: '',
    contributingFactors: [],
    timeline: [],
    actionItems: [],
    updatedAt: now.toISOString(),
  }
}
