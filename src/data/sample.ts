import type { Incident } from '../types'

export const sampleIncident: Incident = {
  schemaVersion: 1,
  id: 'INC-2026-0814',
  title: 'Checkout requests stalled after connection pool exhaustion',
  summary:
    'A release changed database retry behavior, saturating the checkout connection pool and delaying payment requests in the EU region.',
  severity: 'SEV-2',
  status: 'resolved',
  services: ['checkout-api', 'payments-worker', 'postgres-primary'],
  startedAt: '2026-08-14T09:12',
  detectedAt: '2026-08-14T09:19',
  resolvedAt: '2026-08-14T10:07',
  impact:
    'For 55 minutes, 18% of EU checkout attempts took longer than 10 seconds. Approximately 3.4% failed after client-side timeouts; no payments were duplicated.',
  rootCause:
    'The new retry path kept a database connection checked out while waiting between attempts. Under elevated traffic, idle retries consumed the pool and queued unrelated requests.',
  resolution:
    'We rolled back the retry change, drained affected workers, and restored pool availability. Error rates returned to baseline within four minutes.',
  contributingFactors: [
    'The load test covered throughput but did not model partial database failure.',
    'Pool saturation had a dashboard panel but no paging alert.',
    'The rollout reached 100% before the regional latency signal was reviewed.',
  ],
  timeline: [
    {
      id: 'event-1',
      at: '2026-08-14T09:12',
      label: 'Regression introduced',
      note: 'Retry policy release completed in the EU production region.',
    },
    {
      id: 'event-2',
      at: '2026-08-14T09:19',
      label: 'Incident detected',
      note: 'Checkout latency alert fired; on-call began triage.',
    },
    {
      id: 'event-3',
      at: '2026-08-14T09:34',
      label: 'Pool saturation identified',
      note: 'Traces connected request queuing to connections held during retry backoff.',
    },
    {
      id: 'event-4',
      at: '2026-08-14T09:48',
      label: 'Rollback started',
      note: 'Deployment reverted and affected workers began draining.',
    },
    {
      id: 'event-5',
      at: '2026-08-14T10:07',
      label: 'Service recovered',
      note: 'Latency and error rate held at baseline for ten minutes.',
    },
  ],
  actionItems: [
    {
      id: 'action-1',
      task: 'Release database connections before retry backoff',
      owner: 'Platform',
      due: '2026-08-18',
      status: 'done',
    },
    {
      id: 'action-2',
      task: 'Add a pool-saturation paging alert',
      owner: 'SRE',
      due: '2026-08-21',
      status: 'in_progress',
    },
    {
      id: 'action-3',
      task: 'Model partial database failure in load tests',
      owner: 'Checkout',
      due: '2026-08-28',
      status: 'open',
    },
  ],
  updatedAt: '2026-08-15T14:30:00.000Z',
}
