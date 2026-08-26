export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4'
export type IncidentStatus = 'investigating' | 'monitoring' | 'resolved'
export type ActionStatus = 'open' | 'in_progress' | 'done'

export interface TimelineEvent {
  id: string
  at: string
  label: string
  note: string
}

export interface ActionItem {
  id: string
  task: string
  owner: string
  due: string
  status: ActionStatus
}

export interface Incident {
  schemaVersion: 1
  id: string
  title: string
  summary: string
  severity: Severity
  status: IncidentStatus
  services: string[]
  startedAt: string
  detectedAt: string
  resolvedAt: string
  impact: string
  rootCause: string
  resolution: string
  contributingFactors: string[]
  timeline: TimelineEvent[]
  actionItems: ActionItem[]
  updatedAt: string
}

export interface IncidentMetrics {
  durationMinutes: number | null
  detectionMinutes: number | null
  completionPercent: number
}
