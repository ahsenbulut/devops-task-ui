import { Link } from 'react-router';
import { PRIORITIES, PRIORITY_LABELS, getTicketStats } from '../api/tickets';
import { useApi } from '../api/useApi';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { ErrorState, Loading, PageHeader } from '../components/States';
import { timeAgo } from '../format';

export function DashboardPage() {
  const { data: stats, error, loading, retry } = useApi(getTicketStats, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of support and operations requests"
        actions={
          <Link to="/tickets/new" className="button">
            + New ticket
          </Link>
        }
      />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {stats && (
        <>
          <section className="kpi-grid" aria-label="Ticket counts">
            <Kpi label="Total tickets" value={stats.total} tone="neutral" />
            <Kpi label="Open" value={stats.byStatus.open} tone="open" />
            <Kpi label="In progress" value={stats.byStatus.in_progress} tone="in_progress" />
            <Kpi label="Resolved" value={stats.byStatus.resolved} tone="resolved" />
          </section>

          <div className="dashboard-grid">
            <section className="card">
              <h2>By priority</h2>
              <ul className="bars">
                {PRIORITIES.map((priority) => {
                  const count = stats.byPriority[priority];
                  const width = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <li key={priority}>
                      <span className="bar-label">{PRIORITY_LABELS[priority]}</span>
                      <span className="bar-track">
                        <span
                          className={`bar-fill priority-${priority}`}
                          style={{ width: `${width}%` }}
                        />
                      </span>
                      <span className="bar-value">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="card">
              <h2>Recent activity</h2>
              {stats.recent.length === 0 ? (
                <p className="muted">No tickets yet. Create the first one to get started.</p>
              ) : (
                <ul className="activity">
                  {stats.recent.map((ticket) => (
                    <li key={ticket.id}>
                      <Link to={`/tickets/${ticket.id}`} className="activity-title">
                        {ticket.title}
                      </Link>
                      <span className="activity-meta">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        <span className="muted">updated {timeAgo(ticket.updatedAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}
