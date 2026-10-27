import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderAt, ticket } from '../test/utils';

describe('Dashboard', () => {
  it('shows KPI counts, priority bars and recent activity', async () => {
    mockFetch(() => ({
      body: {
        data: {
          total: 5,
          byStatus: { open: 2, in_progress: 1, resolved: 2 },
          byPriority: { low: 1, medium: 1, high: 3 },
          recent: [ticket()],
        },
      },
    }));

    renderAt('/');

    const kpis = await screen.findByRole('region', { name: 'Ticket counts' });
    expect(within(kpis).getByText('Total tickets').nextSibling).toHaveTextContent('5');
    expect(within(kpis).getByText('In progress').nextSibling).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: 'VPN disconnects every hour' })).toHaveAttribute(
      'href',
      '/tickets/11111111-2222-3333-4444-555555555555',
    );
  });

  it('shows an error with retry when the API is down', async () => {
    let calls = 0;
    mockFetch(() => {
      calls += 1;
      return calls === 1
        ? { status: 503, body: { error: { message: 'Service unavailable' } } }
        : { body: { data: { total: 0, byStatus: {}, byPriority: {}, recent: [] } } };
    });

    renderAt('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/No tickets yet/)).toBeInTheDocument();
  });
});

describe('Tickets list', () => {
  it('lists tickets and refetches when filters change', async () => {
    const fetchMock = mockFetch(() => ({ body: { data: [ticket()] } }));

    renderAt('/tickets');

    expect(
      await screen.findByRole('link', { name: 'VPN disconnects every hour' }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Filter by status'), 'in_progress');
    await userEvent.selectOptions(screen.getByLabelText('Filter by priority'), 'high');
    await userEvent.type(screen.getByLabelText('Search tickets'), 'vpn');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/tickets?status=in_progress&priority=high&q=vpn',
        expect.anything(),
      );
    });
  });

  it('shows an empty state', async () => {
    mockFetch(() => ({ body: { data: [] } }));

    renderAt('/tickets?status=resolved');

    expect(await screen.findByText('No tickets match these filters.')).toBeInTheDocument();
  });
});

describe('Ticket details', () => {
  it('updates the status and priority', async () => {
    const fetchMock = mockFetch((_url, init) => {
      if (init.method === 'PATCH') {
        return { body: { data: ticket({ ...(JSON.parse(init.body as string) as object) }) } };
      }
      return { body: { data: ticket() } };
    });

    renderAt('/tickets/11111111-2222-3333-4444-555555555555');

    await userEvent.click(await screen.findByRole('button', { name: 'Resolved' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'low');
    const patches = fetchMock.mock.calls
      .filter(([, init]) => init?.method === 'PATCH')
      .map(([, init]) => init?.body);
    expect(patches).toEqual([
      JSON.stringify({ status: 'resolved' }),
      JSON.stringify({ priority: 'low' }),
    ]);
  });

  it('shows the save error from the API', async () => {
    mockFetch((_url, init) =>
      init.method === 'PATCH'
        ? { status: 400, body: { error: { message: 'Validation failed' } } }
        : { body: { data: ticket() } },
    );

    renderAt('/tickets/11111111-2222-3333-4444-555555555555');

    await userEvent.click(await screen.findByRole('button', { name: 'In progress' }));
    expect(await screen.findByText('Validation failed')).toBeInTheDocument();
  });

  it('shows not found for unknown tickets', async () => {
    mockFetch(() => ({ status: 404, body: { error: { message: 'not found' } } }));

    renderAt('/tickets/00000000-0000-0000-0000-000000000000');

    expect(await screen.findByRole('heading', { name: 'Ticket not found' })).toBeInTheDocument();
  });
});

describe('New ticket', () => {
  it('requires a title before calling the API', async () => {
    const fetchMock = mockFetch(() => ({ body: { data: ticket() } }));

    renderAt('/tickets/new');
    await userEvent.click(screen.getByRole('button', { name: 'Create ticket' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Title is required.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates the ticket and opens its detail page', async () => {
    const fetchMock = mockFetch((_url, init) =>
      init.method === 'POST'
        ? { status: 201, body: { data: ticket({ title: 'Printer offline' }) } }
        : { body: { data: ticket({ title: 'Printer offline' }) } },
    );

    renderAt('/tickets/new');
    await userEvent.type(screen.getByLabelText('Title'), 'Printer offline');
    await userEvent.click(screen.getByRole('button', { name: 'High' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create ticket' }));

    expect(await screen.findByRole('heading', { name: 'Printer offline' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ title: 'Printer offline', priority: 'high' }),
    );
  });

  it('shows validation details returned by the API', async () => {
    mockFetch(() => ({
      status: 400,
      body: {
        error: { message: 'Validation failed', details: ['title must be at most 200 characters'] },
      },
    }));

    renderAt('/tickets/new');
    await userEvent.type(screen.getByLabelText('Title'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Create ticket' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'title must be at most 200 characters',
    );
  });
});

describe('Navigation', () => {
  it('shows a not found page for unknown routes', () => {
    mockFetch(() => ({ body: { data: [] } }));

    renderAt('/nope');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
