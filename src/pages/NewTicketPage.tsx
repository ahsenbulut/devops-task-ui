import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { PRIORITIES, PRIORITY_LABELS, createTicket, type TicketPriority } from '../api/tickets';
import { PageHeader } from '../components/States';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

export function NewTicketPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!title.trim()) {
      setErrors(['Title is required.']);
      return;
    }
    setSubmitting(true);
    setErrors([]);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        priority,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      void navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : undefined;
      setErrors(
        apiError?.details.length
          ? apiError.details
          : [apiError?.message ?? 'Could not create ticket'],
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="New ticket" subtitle="Describe the problem so the team can pick it up" />
      <form className="card form" onSubmit={(event) => void submit(event)} noValidate>
        {errors.length > 0 && (
          <ul className="form-errors" role="alert">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        <label className="field">
          <span>Title</span>
          <input
            className="input"
            value={title}
            maxLength={TITLE_MAX}
            placeholder="e.g. VPN disconnects every hour"
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </label>
        <label className="field">
          <span>
            Description <span className="muted">(optional)</span>
          </span>
          <textarea
            className="input"
            rows={6}
            value={description}
            maxLength={DESCRIPTION_MAX}
            placeholder="What happened, who is affected, any error messages…"
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
          <span className="hint">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </label>
        <fieldset className="field">
          <legend>Priority</legend>
          <div className="segmented">
            {PRIORITIES.map((value) => (
              <button
                key={value}
                type="button"
                className={value === priority ? 'active' : ''}
                aria-pressed={value === priority}
                onClick={() => {
                  setPriority(value);
                }}
              >
                {PRIORITY_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              void navigate('/tickets');
            }}
          >
            Cancel
          </button>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
      </form>
    </>
  );
}
