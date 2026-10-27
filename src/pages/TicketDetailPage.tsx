import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/client';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  getTicket,
  updateTicket,
  type TicketPriority,
  type TicketStatus,
} from '../api/tickets';
import { useApi } from '../api/useApi';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { ErrorState, Loading } from '../components/States';
import { formatDateTime, shortId, timeAgo } from '../format';

export function TicketDetailPage() {
  const { id = '' } = useParams();
  const { data: ticket, error, loading, retry, setData } = useApi(() => getTicket(id), [id]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [savedAt, setSavedAt] = useState<string>();

  const save = async (changes: { status?: TicketStatus; priority?: TicketPriority }) => {
    setSaving(true);
    setSaveError(undefined);
    try {
      setData(await updateTicket(id, changes));
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error?.status === 404) {
    return (
      <div className="card empty">
        <h1>Ticket not found</h1>
        <p className="muted">It may have been removed or the link is wrong.</p>
        <Link to="/tickets" className="button button-secondary">
          Back to tickets
        </Link>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!ticket) return null;

  return (
    <>
      <Link to="/tickets" className="back-link">
        ← All tickets
      </Link>
      <div className="detail-grid">
        <article className="card detail-main">
          <span className="ticket-id">{shortId(ticket.id)}</span>
          <h1 className="detail-title">{ticket.title}</h1>
          <div className="activity-meta">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h2>Description</h2>
          <p className={ticket.description ? 'description' : 'muted'}>
            {ticket.description ?? 'No description provided.'}
          </p>
        </article>

        <aside className="card detail-side">
          <h2>Status</h2>
          <div className="segmented" role="group" aria-label="Change status">
            {STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                className={value === ticket.status ? 'active' : ''}
                aria-pressed={value === ticket.status}
                disabled={saving}
                onClick={() => {
                  if (value !== ticket.status) void save({ status: value });
                }}
              >
                {STATUS_LABELS[value]}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Priority</span>
            <select
              className="input"
              value={ticket.priority}
              disabled={saving}
              onChange={(event) => {
                void save({ priority: event.target.value as TicketPriority });
              }}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <p className="save-state" aria-live="polite">
            {saving && 'Saving…'}
            {!saving && saveError && <span className="text-error">{saveError}</span>}
            {!saving && !saveError && savedAt && 'Saved'}
          </p>

          <dl className="meta">
            <dt>Created</dt>
            <dd>{formatDateTime(ticket.createdAt)}</dd>
            <dt>Last updated</dt>
            <dd>
              {formatDateTime(ticket.updatedAt)}{' '}
              <span className="muted">({timeAgo(ticket.updatedAt)})</span>
            </dd>
          </dl>
        </aside>
      </div>
    </>
  );
}
