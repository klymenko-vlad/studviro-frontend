'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import { teacherQueries, type TeacherOffering } from '@/entities/teacher';
import { toApiError } from '@/shared/api';
import { Link } from '@/shared/config';
import { initials } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LinkRow,
  LinkRowChevron,
  ListSkeleton,
  LoadMore,
  Skeleton,
  ToneDot,
} from '@/shared/ui';

export function TeacherProfile({
  institutionId,
  teacherId,
}: {
  institutionId: string;
  teacherId: string;
}) {
  const t = useTranslations('teacherProfile');
  const { data, isPending, error } = useQuery(
    teacherQueries.profile({ path: { institutionId, userId: teacherId } }),
  );

  if (isPending)
    return <Skeleton className="h-64 w-full" data-testid="teacher-profile-loading" />;

  if (error) {
    const missing = toApiError(error).status === 404;

    return (
      <Alert variant={missing ? 'default' : 'destructive'}>
        <AlertTitle>{t(missing ? 'notFoundTitle' : 'errorTitle')}</AlertTitle>
        <AlertDescription>
          {t(missing ? 'notFoundDescription' : 'errorDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg font-semibold">
            {initials(data.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="type-title">{data.displayName}</h1>
          <a
            href={`mailto:${data.email}`}
            className="text-muted-foreground hover:text-foreground w-fit break-all underline-offset-4 hover:underline"
          >
            {data.email}
          </a>
          {data.departments.length === 0 ? null : (
            <ul aria-label={t('departments')} className="flex flex-wrap gap-2 pt-1">
              {data.departments.map(department => (
                <li key={department.id}>
                  <Badge variant="outline">{department.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <TaughtCourses institutionId={institutionId} teacherId={teacherId} />
    </div>
  );
}

const PAGE = 20;

function TaughtCourses({
  institutionId,
  teacherId,
}: {
  institutionId: string;
  teacherId: string;
}) {
  const t = useTranslations('teacherProfile');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());
  const courses = useInfiniteQuery({
    ...teacherQueries.offerings({
      path: { institutionId, userId: teacherId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const offerings = courses.data?.pages.flatMap(page => page.items) ?? [];
  const teachesNothing = q === '' && courses.isSuccess && offerings.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('courses')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {teachesNothing ? null : (
          <div className="flex flex-col gap-1">
            <Label htmlFor={filterId}>{t('filter')}</Label>
            <Input
              id={filterId}
              type="search"
              autoComplete="off"
              placeholder={t('filterPlaceholder')}
              value={filter}
              onChange={event => {
                setFilter(event.target.value);
              }}
            />
          </div>
        )}

        {courses.isPending ? (
          <ListSkeleton items={4} data-testid="teacher-courses-loading" />
        ) : courses.isError ? (
          <p className="text-muted-foreground text-sm">{t('coursesError')}</p>
        ) : teachesNothing ? (
          <p className="text-muted-foreground text-sm">{t('noCourses')}</p>
        ) : offerings.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noMatch', { query: q })}</p>
        ) : (
          <>
            <ul className="-mx-2 flex flex-col">
              {offerings.map(offering => (
                <li key={offering.offeringId}>
                  <OfferingRow institutionId={institutionId} offering={offering} />
                </li>
              ))}
            </ul>
            <LoadMore
              shown={offerings.length}
              hasMore={courses.hasNextPage}
              pending={courses.isFetchingNextPage}
              onLoadMore={() => {
                void courses.fetchNextPage();
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OfferingRow({
  institutionId,
  offering,
}: {
  institutionId: string;
  offering: TeacherOffering;
}) {
  const body = (
    <>
      <ToneDot code={offering.courseCode} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{offering.courseTitle}</span>
        <span className="text-muted-foreground text-xs">
          {offering.courseCode} · {offering.termName}
        </span>
      </span>
    </>
  );

  if (!offering.viewerCanOpen)
    return <div className="flex items-center gap-3 px-2 py-2 text-sm">{body}</div>;

  return (
    <LinkRow asChild>
      <Link href={courseOfferingHref(institutionId, offering.offeringId)}>
        {body}
        <LinkRowChevron />
      </Link>
    </LinkRow>
  );
}
