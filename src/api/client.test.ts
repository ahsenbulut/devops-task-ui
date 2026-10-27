import { describe, expect, it, vi } from 'vitest';
import { mockFetch } from '../test/utils';
import { ApiError, apiRequest } from './client';
import { listTickets } from './tickets';

describe('apiRequest', () => {
  it('returns the data field of successful responses', async () => {
    mockFetch(() => ({ body: { data: { ok: true } } }));

    await expect(apiRequest('/x')).resolves.toEqual({ ok: true });
  });

  it('turns API errors into ApiError with details', async () => {
    mockFetch(() => ({
      status: 400,
      body: { error: { message: 'Validation failed', details: ['title must not be empty'] } },
    }));

    const error = await apiRequest('/x').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: ['title must not be empty'],
    });
  });

  it('reports network failures as status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 0 });
  });

  it('handles non-JSON error responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 }))),
    );

    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    });
  });

  it('builds ticket list URLs from non-empty filters only', async () => {
    const fetchMock = mockFetch(() => ({ body: { data: [] } }));

    await listTickets({ status: 'open', priority: '', q: 'vpn' });
    await listTickets();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/tickets?status=open&q=vpn',
      '/api/tickets',
    ]);
  });
});
