import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  Clipboard,
  Clock3,
  Code2,
  Download,
  FileJson,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { sampleIncident } from './data/sample'
import {
  blankIncident,
  calculateMetrics,
  createId,
  formatDuration,
  formatTimestamp,
  parseIncident,
  toMarkdown,
} from './lib/incident'
import { loadIncident, saveIncident } from './lib/storage'
import type { ActionItem, Incident, TimelineEvent } from './types'

function cloneSample(): Incident {
  return structuredClone(sampleIncident)
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

interface SectionHeaderProps {
  number: string
  title: string
  kicker: string
}

function SectionHeader({ number, title, kicker }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <span className="section-number">{number}</span>
      <div>
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
    </header>
  )
}

interface TimelineEditorProps {
  events: TimelineEvent[]
  startedAt: string
  onChange: (events: TimelineEvent[]) => void
}

function TimelineEditor({ events, startedAt, onChange }: TimelineEditorProps) {
  const update = (id: string, patch: Partial<TimelineEvent>) => {
    onChange(events.map((event) => (event.id === id ? { ...event, ...patch } : event)))
  }

  const remove = (id: string) => onChange(events.filter((event) => event.id !== id))
  const add = () => {
    onChange([
      ...events,
      { id: createId('event'), at: '', label: 'New event', note: '' },
    ])
  }

  return (
    <div className="timeline-editor">
      {events.length === 0 && (
        <div className="empty-state">
          <Clock3 size={22} />
          <p>Build a shared sequence of what happened and when.</p>
        </div>
      )}
      {events.map((event, index) => {
        const elapsed = calculateMetrics({
          ...sampleIncident,
          startedAt,
          detectedAt: event.at,
        }).detectionMinutes
        return (
          <article className="timeline-row" key={event.id}>
            <div className="timeline-marker" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="timeline-time">
              <span>{event.at ? `T+${formatDuration(elapsed)}` : 'TIME'}</span>
              <input
                aria-label={`Time for timeline event ${index + 1}`}
                type="datetime-local"
                value={event.at}
                onChange={(eventInput) => update(event.id, { at: eventInput.target.value })}
              />
            </div>
            <div className="timeline-copy">
              <input
                aria-label={`Title for timeline event ${index + 1}`}
                className="line-input strong"
                value={event.label}
                onChange={(eventInput) => update(event.id, { label: eventInput.target.value })}
              />
              <textarea
                aria-label={`Notes for timeline event ${index + 1}`}
                className="line-input"
                rows={2}
                value={event.note}
                placeholder="What changed? What did the team learn?"
                onChange={(eventInput) => update(event.id, { note: eventInput.target.value })}
              />
            </div>
            <button
              className="icon-button quiet"
              type="button"
              aria-label={`Remove ${event.label}`}
              onClick={() => remove(event.id)}
            >
              <Trash2 size={17} />
            </button>
          </article>
        )
      })}
      <button className="add-row" type="button" onClick={add}>
        <Plus size={17} /> Add timeline event
      </button>
    </div>
  )
}

interface ActionsEditorProps {
  items: ActionItem[]
  onChange: (items: ActionItem[]) => void
}

function ActionsEditor({ items, onChange }: ActionsEditorProps) {
  const update = (id: string, patch: Partial<ActionItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id))
  const add = () => {
    onChange([
      ...items,
      { id: createId('action'), task: 'New follow-up', owner: '', due: '', status: 'open' },
    ])
  }

  return (
    <div className="actions-editor">
      <div className="action-head" aria-hidden="true">
        <span>State</span><span>Follow-up</span><span>Owner</span><span>Due</span><span />
      </div>
      {items.length === 0 && (
        <div className="empty-state action-empty">
          <ShieldCheck size={22} />
          <p>Turn lessons into owned, time-bound improvements.</p>
        </div>
      )}
      {items.map((item, index) => (
        <article className={`action-row status-${item.status}`} key={item.id}>
          <select
            aria-label={`Status for action ${index + 1}`}
            value={item.status}
            onChange={(event) => update(item.id, { status: event.target.value as ActionItem['status'] })}
          >
            <option value="open">Open</option>
            <option value="in_progress">Doing</option>
            <option value="done">Done</option>
          </select>
          <input
            aria-label={`Task for action ${index + 1}`}
            className="line-input strong"
            value={item.task}
            onChange={(event) => update(item.id, { task: event.target.value })}
          />
          <input
            aria-label={`Owner for action ${index + 1}`}
            className="line-input"
            value={item.owner}
            placeholder="Unassigned"
            onChange={(event) => update(item.id, { owner: event.target.value })}
          />
          <input
            aria-label={`Due date for action ${index + 1}`}
            type="date"
            value={item.due}
            onChange={(event) => update(item.id, { due: event.target.value })}
          />
          <button
            className="icon-button quiet"
            type="button"
            aria-label={`Remove ${item.task}`}
            onClick={() => remove(item.id)}
          >
            <Trash2 size={17} />
          </button>
        </article>
      ))}
      <button className="add-row" type="button" onClick={add}>
        <Plus size={17} /> Add follow-up action
      </button>
    </div>
  )
}

export default function App() {
  const [incident, setIncident] = useState<Incident>(() => loadIncident(cloneSample()))
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const metrics = calculateMetrics(incident)

  useEffect(() => {
    saveIncident(incident)
  }, [incident])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const updateIncident = (patch: Partial<Incident>) => {
    setIncident((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }))
  }

  const replaceIncident = (next: Incident, message: string) => {
    setIncident({ ...next, updatedAt: new Date().toISOString() })
    setNotice(message)
  }

  const exportMarkdown = () => {
    downloadFile(`${incident.id.toLowerCase()}-postmortem.md`, toMarkdown(incident), 'text/markdown')
    setNotice('Markdown report exported')
  }

  const exportJson = () => {
    downloadFile(`${incident.id.toLowerCase()}.json`, JSON.stringify(incident, null, 2), 'application/json')
    setNotice('Portable incident file exported')
  }

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(incident))
      setNotice('Markdown copied to clipboard')
    } catch {
      setNotice('Clipboard access is unavailable')
    }
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const next = parseIncident(JSON.parse(await file.text()))
      replaceIncident(next, 'Incident file imported')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import this file')
    }
  }

  const servicesValue = incident.services.join(', ')
  const completedActions = incident.actionItems.filter((item) => item.status === 'done').length

  return (
    <div className="app-shell">
      <a className="skip-link" href="#report">Skip to report</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Incident Canvas home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>Incident</strong> Canvas</span>
        </a>
        <nav className="top-actions" aria-label="Report actions">
          <span className="saved-indicator"><Check size={14} /> Stored on this device</span>
          <button type="button" onClick={copyMarkdown}><Clipboard size={16} /> Copy report</button>
          <button type="button" onClick={() => fileInput.current?.click()}><Upload size={16} /> Import</button>
          <div className="export-group">
            <button type="button" onClick={exportMarkdown}><Download size={16} /> Markdown</button>
            <button type="button" aria-label="Export JSON" onClick={exportJson}><FileJson size={16} /></button>
          </div>
          <button type="button" aria-label="Print report" onClick={() => window.print()}><Printer size={16} /></button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={importJson} />
        </nav>
      </header>

      <main id="report">
        <section className="dossier-cover" id="top">
          <div className="cover-index" aria-hidden="true">POST<br />MORTEM</div>
          <div className="cover-main">
            <div className="eyebrow-row">
              <input
                className="incident-id"
                aria-label="Incident identifier"
                value={incident.id}
                onChange={(event) => updateIncident({ id: event.target.value })}
              />
              <span className={`status-pill status-${incident.status}`}>
                <span />{incident.status}
              </span>
            </div>
            <textarea
              className="title-input"
              aria-label="Incident title"
              rows={2}
              value={incident.title}
              onChange={(event) => updateIncident({ title: event.target.value })}
            />
            <textarea
              className="summary-input"
              aria-label="Executive summary"
              rows={3}
              value={incident.summary}
              placeholder="Write a plain-language summary of what happened."
              onChange={(event) => updateIncident({ summary: event.target.value })}
            />
          </div>
          <div className={`severity-stamp ${incident.severity.toLowerCase()}`}>
            <span>Classification</span>
            <strong>{incident.severity}</strong>
          </div>
        </section>

        <section className="control-strip" aria-label="Incident controls">
          <Field label="Severity">
            <select value={incident.severity} onChange={(event) => updateIncident({ severity: event.target.value as Incident['severity'] })}>
              <option>SEV-1</option><option>SEV-2</option><option>SEV-3</option><option>SEV-4</option>
            </select>
          </Field>
          <Field label="Response status">
            <select value={incident.status} onChange={(event) => updateIncident({ status: event.target.value as Incident['status'] })}>
              <option value="investigating">Investigating</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </Field>
          <Field label="Affected services" className="services-field" hint="Separate services with commas">
            <input
              value={servicesValue}
              onChange={(event) => updateIncident({ services: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </Field>
          <div className="reset-actions">
            <button type="button" onClick={() => replaceIncident(blankIncident(), 'Blank report created')}><Plus size={16} /> New</button>
            <button type="button" onClick={() => replaceIncident(cloneSample(), 'Example restored')}><RefreshCw size={16} /> Example</button>
          </div>
        </section>

        <div className="report-grid">
          <aside className="metric-rail" aria-label="Incident metrics">
            <div className="rail-heading">
              <span>Response record</span>
              <strong>{incident.id}</strong>
            </div>
            <div className="metric-block coral">
              <span>Time to recovery</span>
              <strong>{formatDuration(metrics.durationMinutes)}</strong>
              <small>start → resolved</small>
            </div>
            <div className="metric-block cyan">
              <span>Detection gap</span>
              <strong>{formatDuration(metrics.detectionMinutes)}</strong>
              <small>start → detected</small>
            </div>
            <div className="metric-block acid">
              <span>Actions closed</span>
              <strong>{metrics.completionPercent}%</strong>
              <small>{completedActions} of {incident.actionItems.length}</small>
            </div>
            <div className="privacy-note">
              <ShieldCheck size={19} />
              <div><strong>Local by design</strong><p>Your report never leaves this browser unless you export it.</p></div>
            </div>
            <a className="source-link" href="https://github.com/kyan9400/incident-canvas" target="_blank" rel="noreferrer">
              <Code2 size={17} /> View source
            </a>
          </aside>

          <div className="report-body">
            <section className="report-section response-window">
              <SectionHeader number="01" kicker="When it happened" title="Response window" />
              <div className="date-grid">
                <Field label="Incident started">
                  <input type="datetime-local" value={incident.startedAt} onChange={(event) => updateIncident({ startedAt: event.target.value })} />
                </Field>
                <Field label="Team detected it">
                  <input type="datetime-local" value={incident.detectedAt} onChange={(event) => updateIncident({ detectedAt: event.target.value })} />
                </Field>
                <Field label="Service recovered">
                  <input type="datetime-local" value={incident.resolvedAt} onChange={(event) => updateIncident({ resolvedAt: event.target.value })} />
                </Field>
              </div>
            </section>

            <section className="report-section impact-section">
              <SectionHeader number="02" kicker="Who and what" title="Customer impact" />
              <Field label="Describe the measurable impact" hint="Include scope, duration, geography, and whether data integrity was affected.">
                <textarea rows={5} value={incident.impact} placeholder="What did customers experience?" onChange={(event) => updateIncident({ impact: event.target.value })} />
              </Field>
              <div className="service-tags" aria-label="Affected service list">
                {incident.services.map((service) => <span key={service}>{service}</span>)}
              </div>
            </section>

            <section className="report-section timeline-section">
              <SectionHeader number="03" kicker="Shared sequence" title="Incident timeline" />
              <TimelineEditor events={incident.timeline} startedAt={incident.startedAt} onChange={(timeline) => updateIncident({ timeline })} />
            </section>

            <section className="report-section analysis-section">
              <SectionHeader number="04" kicker="Learn, don't blame" title="Analysis" />
              <div className="analysis-grid">
                <Field label="Root cause">
                  <textarea rows={7} value={incident.rootCause} placeholder="What technical or systemic condition caused the incident?" onChange={(event) => updateIncident({ rootCause: event.target.value })} />
                </Field>
                <Field label="Resolution">
                  <textarea rows={7} value={incident.resolution} placeholder="How was service restored and verified?" onChange={(event) => updateIncident({ resolution: event.target.value })} />
                </Field>
              </div>
              <div className="factors-block">
                <span className="field-label">Contributing factors</span>
                {incident.contributingFactors.map((factor, index) => (
                  <div className="factor-row" key={`${index}-${factor.slice(0, 12)}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <input
                      aria-label={`Contributing factor ${index + 1}`}
                      value={factor}
                      onChange={(event) => {
                        const factors = [...incident.contributingFactors]
                        factors[index] = event.target.value
                        updateIncident({ contributingFactors: factors })
                      }}
                    />
                    <button type="button" className="icon-button quiet" aria-label={`Remove contributing factor ${index + 1}`} onClick={() => updateIncident({ contributingFactors: incident.contributingFactors.filter((_, itemIndex) => itemIndex !== index) })}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button className="add-row" type="button" onClick={() => updateIncident({ contributingFactors: [...incident.contributingFactors, 'New contributing factor'] })}>
                  <Plus size={17} /> Add contributing factor
                </button>
              </div>
            </section>

            <section className="report-section actions-section">
              <div className="actions-title-row">
                <SectionHeader number="05" kicker="Make learning durable" title="Follow-up actions" />
                <div className="completion-dial" style={{ '--progress': `${metrics.completionPercent * 3.6}deg` } as CSSProperties}>
                  <strong>{metrics.completionPercent}%</strong><span>closed</span>
                </div>
              </div>
              <ActionsEditor items={incident.actionItems} onChange={(actionItems) => updateIncident({ actionItems })} />
            </section>
          </div>
        </div>
      </main>

      <footer>
        <div><AlertTriangle size={17} /><span>Write for learning, not blame.</span></div>
        <p>Incident Canvas · Open source under MIT · Last edited {formatTimestamp(incident.updatedAt)}</p>
      </footer>

      <div className={`notice ${notice ? 'visible' : ''}`} role="status" aria-live="polite">
        <Check size={17} /> {notice}
      </div>
    </div>
  )
}
