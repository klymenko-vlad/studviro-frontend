import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import type { DiscussionPost } from '../model/discussion';

/** `editor`, when given, takes the place of the text while its author rewrites it. */
export function DiscussionPostItem({
  post,
  actions,
  editor,
  files,
}: {
  post: DiscussionPost;
  actions?: ReactNode;
  editor?: ReactNode;
  files?: ReactNode;
}) {
  const t = useTranslations('discussion');
  const format = useFormatter();

  return (
    <article
      className="border-border flex flex-col gap-2 border-b py-4 last:border-b-0"
      aria-label={post.author.displayName}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-medium">{post.author.displayName}</span>
        {post.author.isTeacher ? (
          <Badge variant="outline">{t('teacherBadge')}</Badge>
        ) : null}
        <time dateTime={post.createdAt} className="text-muted-foreground text-xs">
          {format.dateTime(new Date(post.createdAt), {
            day: 'numeric',
            month: 'long',
            hour: 'numeric',
            minute: 'numeric',
          })}
        </time>
        {post.editedAt === null ? null : (
          <span className="text-muted-foreground text-xs">{t('edited')}</span>
        )}
        {post.state === 'hidden' ? (
          <Badge variant="secondary">{t('hiddenBadge')}</Badge>
        ) : null}
      </header>

      {editor ??
        (post.body === null ? (
          <p className="text-muted-foreground text-sm italic">
            {post.state === 'deleted' ? t('deletedPost') : t('hiddenPost')}
          </p>
        ) : (
          <p className="text-sm whitespace-pre-line">{post.body}</p>
        ))}

      {files === undefined || editor !== undefined ? null : files}

      {actions === undefined ? null : (
        <div className="flex flex-wrap gap-2">{actions}</div>
      )}
    </article>
  );
}
