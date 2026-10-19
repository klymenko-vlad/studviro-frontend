import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen, server } from '@/shared/test';

import { OfferingDiscussion } from './offering-discussion';

const replace = vi.hoisted(() => vi.fn<(href: string, options?: object) => void>());
const search = vi.hoisted(() => ({ value: '' }));
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => '/institutions/i/courses/o',
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const THREAD = '77777777-7777-4777-8777-777777777777';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}/discussion/threads`;

const author = {
  id: '11111111-1111-4111-8111-111111111111',
  displayName: 'Ada Lovelace',
  isTeacher: false,
};
const summary = {
  id: THREAD,
  title: 'Question 3',
  author,
  createdAt: '2026-10-20T08:00:00.000Z',
  lastActivityAt: '2026-10-20T09:00:00.000Z',
  postCount: 2,
  hidden: false,
};
const thread = (overrides: object = {}) => ({
  ...summary,
  canModerate: false,
  posts: [
    {
      id: '88888888-8888-4888-8888-888888888881',
      author,
      body: 'What does stable mean?',
      state: 'visible',
      mine: true,
      createdAt: '2026-10-20T08:00:00.000Z',
      editedAt: null,
      attachments: [],
    },
    {
      id: '88888888-8888-4888-8888-888888888882',
      author: {
        id: '22222222-2222-4222-8222-222222222222',
        displayName: 'Ján Novák',
        isTeacher: true,
      },
      body: null,
      state: 'hidden',
      mine: false,
      createdAt: '2026-10-20T09:00:00.000Z',
      editedAt: null,
      attachments: [],
    },
  ],
  ...overrides,
});

const renderDiscussion = () =>
  renderWithProviders(
    <OfferingDiscussion institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('OfferingDiscussion', () => {
  it('lists the threads with who started them and how many posts they have', async () => {
    search.value = 'section=discussion';
    server.use(
      http.get(BASE, () => HttpResponse.json({ canModerate: false, threads: [summary] })),
    );

    renderDiscussion();

    expect(await screen.findByRole('button', { name: 'Question 3' })).toBeInTheDocument();
    expect(screen.getByText(/Ada Lovelace · 2 posts/)).toBeInTheDocument();
  });

  it('says so when nobody has started a thread', async () => {
    search.value = '';
    server.use(
      http.get(BASE, () => HttpResponse.json({ canModerate: false, threads: [] })),
    );

    renderDiscussion();

    expect(
      await screen.findByText('Nobody has started a thread yet.'),
    ).toBeInTheDocument();
  });

  it('opens a thread by writing it into the address', async () => {
    search.value = 'section=discussion';
    server.use(
      http.get(BASE, () => HttpResponse.json({ canModerate: false, threads: [summary] })),
    );

    const { user } = renderDiscussion();
    await user.click(await screen.findByRole('button', { name: 'Question 3' }));

    expect(replace).toHaveBeenCalledWith(
      `/institutions/i/courses/o?section=discussion&thread=${THREAD}`,
      { scroll: false },
    );
  });

  it('shows a thread, withholding what a teacher hid, and offers a reply', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    server.use(http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())));

    renderDiscussion();

    expect(await screen.findByText('What does stable mean?')).toBeInTheDocument();
    expect(screen.getByText('A teacher hid this post.')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide' })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Your reply/)).toBeInTheDocument();
  });

  it('posts a reply and shows the thread the server answers with', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    let sent: unknown;
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())),
      http.post(`${BASE}/${THREAD}/posts`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          thread({
            posts: [
              ...thread().posts,
              {
                id: '88888888-8888-4888-8888-888888888883',
                author,
                body: 'Thanks, got it.',
                state: 'visible',
                mine: true,
                createdAt: '2026-10-20T10:00:00.000Z',
                editedAt: null,
                attachments: [],
              },
            ],
          }),
          { status: 201 },
        );
      }),
    );

    const { user } = renderDiscussion();
    await user.type(await screen.findByLabelText(/^Your reply/), '  Thanks, got it. ');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    expect(await screen.findByText('Thanks, got it.')).toBeInTheDocument();
    expect(sent).toEqual({ body: 'Thanks, got it.' });
  });

  it('edits your own post in place and marks it edited', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    let sent: unknown;
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())),
      http.patch(`${BASE}/${THREAD}/posts/:postId`, async ({ request }) => {
        sent = await request.json();
        const [first, second] = thread().posts;
        return HttpResponse.json(
          thread({
            posts: [
              {
                ...first,
                body: 'What does stable mean here?',
                editedAt: '2026-10-20T11:00:00.000Z',
              },
              second,
            ],
          }),
        );
      }),
    );

    const { user } = renderDiscussion();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const editor = screen.getByRole('textbox', { name: 'Edit your post' });
    expect(editor).toHaveValue('What does stable mean?');
    await user.clear(editor);
    await user.type(editor, 'What does stable mean here?');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('What does stable mean here?')).toBeInTheDocument();
    expect(screen.getByText('edited')).toBeInTheDocument();
    expect(sent).toEqual({ body: 'What does stable mean here?' });
  });

  it('offers no edit on somebody else’s post', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    server.use(
      http.get(`${BASE}/${THREAD}`, () =>
        HttpResponse.json(
          thread({ posts: thread().posts.map(post => ({ ...post, mine: false })) }),
        ),
      ),
    );

    renderDiscussion();
    await screen.findByText('What does stable mean?');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument();
  });

  it('renames a thread you started', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    let sent: unknown;
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())),
      http.patch(`${BASE}/${THREAD}`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(thread({ title: 'Question 3: stability' }));
      }),
    );

    const { user } = renderDiscussion();
    await user.click(await screen.findByRole('button', { name: 'Rename' }));
    const title = screen.getByRole('textbox', { name: 'Title' });
    await user.clear(title);
    await user.type(title, 'Question 3: stability');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'Question 3: stability' }),
    ).toBeInTheDocument();
    expect(sent).toEqual({ title: 'Question 3: stability' });
  });

  it('uploads chosen files before posting the reply that names them', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    const order: string[] = [];
    let sent: { attachments?: unknown[] } | undefined;
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())),
      http.post(`${BASE}/attachment-tickets`, async ({ request }) => {
        order.push('ticket');
        const { filename } = (await request.json()) as { filename: string };
        return HttpResponse.json(
          {
            url: 'https://store.example.org/put',
            headers: { 'content-type': 'image/png' },
            key: `institutions/${INSTITUTION}/discussion/k/${filename}`,
            expiresAt: '2026-10-20T12:00:00.000Z',
            maxBytes: 10 * 1024 * 1024,
          },
          { status: 201 },
        );
      }),
      http.put('https://store.example.org/put', () => {
        order.push('put');
        return new HttpResponse(null, { status: 200 });
      }),
      http.post(`${BASE}/${THREAD}/posts`, async ({ request }) => {
        order.push('reply');
        sent = (await request.json()) as { attachments?: unknown[] };
        return HttpResponse.json(thread(), { status: 201 });
      }),
    );

    const { user } = renderDiscussion();
    await user.type(await screen.findByLabelText(/^Your reply/), 'See the graph.');
    await user.upload(
      screen.getByLabelText('Attachments'),
      new File(['png'], 'graf.png', { type: 'image/png' }),
    );
    expect(screen.getByText('graf.png')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    await vi.waitFor(() => {
      expect(order).toEqual(['ticket', 'put', 'reply']);
    });
    expect(sent?.attachments).toEqual([
      {
        storageKey: `institutions/${INSTITUTION}/discussion/k/graf.png`,
        filename: 'graf.png',
      },
    ]);
  });

  it('refuses a file over 10 MB before uploading anything', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    server.use(http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())));

    const { user } = renderDiscussion();
    const big = new File(['x'], 'video.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    await user.upload(await screen.findByLabelText('Attachments'), big);

    expect(screen.queryByText('video.png')).not.toBeInTheDocument();
  });

  it('offers the files of a post for download', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    const [first, second] = thread().posts;
    server.use(
      http.get(`${BASE}/${THREAD}`, () =>
        HttpResponse.json(
          thread({
            posts: [
              {
                ...first,
                attachments: [
                  {
                    id: '99999999-9999-4999-8999-999999999999',
                    filename: 'graf.png',
                    contentType: 'image/png',
                    sizeBytes: 20480,
                  },
                ],
              },
              second,
            ],
          }),
        ),
      ),
    );

    renderDiscussion();
    expect(
      await screen.findByRole('button', { name: 'Download graf.png' }),
    ).toBeInTheDocument();
  });

  it('asks before deleting for good', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    let deleted = false;
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(thread())),
      http.delete(`${BASE}/${THREAD}/posts/:postId`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderDiscussion();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(deleted).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Delete for good' }));

    await vi.waitFor(() => {
      expect(deleted).toBe(true);
    });
  });

  it('lets a teacher read and restore a hidden post, and hide the thread', async () => {
    search.value = `section=discussion&thread=${THREAD}`;
    let visibility: unknown;
    const moderated = thread({
      canModerate: true,
      posts: [
        thread().posts[0],
        { ...thread().posts[1], body: 'Off-topic advert', mine: false },
      ],
    });
    server.use(
      http.get(`${BASE}/${THREAD}`, () => HttpResponse.json(moderated)),
      http.put(`${BASE}/${THREAD}/posts/:postId/visibility`, async ({ request }) => {
        visibility = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderDiscussion();

    expect(await screen.findByText('Off-topic advert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide thread' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore' }));

    await vi.waitFor(() => {
      expect(visibility).toEqual({ hidden: false });
    });
  });

  it('refuses an empty thread before sending it', async () => {
    search.value = '';
    server.use(
      http.get(BASE, () => HttpResponse.json({ canModerate: false, threads: [] })),
    );

    const { user } = renderDiscussion();
    await user.click(await screen.findByRole('button', { name: 'New thread' }));
    await user.click(screen.getByRole('button', { name: 'Start thread' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  });
});
