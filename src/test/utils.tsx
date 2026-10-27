import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { App } from '../App';
import type { Ticket } from '../api/tickets';

export function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    title: 'VPN disconnects every hour',
    description: 'Remote office users lose VPN',
    status: 'open',
    priority: 'high',
    createdAt: '2026-10-26T10:00:00.000Z',
    updatedAt: '2026-10-26T10:00:00.000Z',
    ...overrides,
  };
}

type Handler = (url: string, init: RequestInit) => { status?: number; body: unknown };

export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const { status = 200, body } = handler(url, init);
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
