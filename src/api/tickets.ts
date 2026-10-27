import { apiRequest } from './client';

export const STATUSES = ['open', 'in_progress', 'resolved'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;

export type TicketStatus = (typeof STATUSES)[number];
export type TicketPriority = (typeof PRIORITIES)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TicketStats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  recent: Ticket[];
}

export interface TicketFilter {
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  q?: string;
}

export interface NewTicket {
  title: string;
  description?: string;
  priority: TicketPriority;
}

export function listTickets(filter: TicketFilter = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  for (const key of ['status', 'priority', 'q'] as const) {
    const value = filter[key];
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return apiRequest<Ticket[]>(`/tickets${query ? `?${query}` : ''}`);
}

export function getTicket(id: string): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${encodeURIComponent(id)}`);
}

export function getTicketStats(): Promise<TicketStats> {
  return apiRequest<TicketStats>('/tickets/stats');
}

export function createTicket(ticket: NewTicket): Promise<Ticket> {
  return apiRequest<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(ticket) });
}

export function updateTicket(
  id: string,
  changes: { status?: TicketStatus; priority?: TicketPriority },
): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}
