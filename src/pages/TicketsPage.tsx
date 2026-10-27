import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  listTickets,
  type TicketPriority,
  type TicketStatus,
} from '../api/tickets';
import { useApi } from '../api/useApi';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { ErrorState, Loading, PageHeader } from '../components/States';
import { shortId, timeAgo } from '../format';

const SEARCH_DEBOUNCE_MS = 300;

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = (params.get('status') ?? '') as TicketStatus | '';
  const priority = (params.get('priority') ?? '') as TicketPriority | '';
  const q = params.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(q);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== q) updateParam('q', searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [searchInput]);

  const {
    data: tickets,
    error,
    loading,
    retry,
  } = useApi(() => listTickets({ status, priority, q }), [status, priority, q]);

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Search and filter support requests"
        actions={
          <Link to="/tickets/new" className="button">
            + New ticket
          </Link>
        }
      />

      <div className="toolbar">
        <input
          type="search"
          className="input search"
          placeholder="Search title or description…"
          aria-label="Search tickets"
          value={searchInput}
          maxLength={100}
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
        />
        <select
          className="input"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            updateParam('status', event.target.value);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filter by priority"
          value={priority}
          onChange={(event) => {
            updateParam('priority', event.target.value);
          }}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {loading && !tickets && <Loading />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {tickets?.length === 0 && (
        <div className="card empty">
          <p>No tickets match these filters.</p>
        </div>
      )}
      {tickets !== undefined && tickets.length > 0 && (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => {
                    void navigate(`/tickets/${ticket.id}`);
                  }}
                >
                  <td>
                    <Link to={`/tickets/${ticket.id}`} className="ticket-title">
                      {ticket.title}
                    </Link>
                    <span className="ticket-id">{shortId(ticket.id)}</span>
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="muted">{timeAgo(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
