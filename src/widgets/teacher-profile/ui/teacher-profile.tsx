'use client';

import { useQuery } from '@tanstack/react-query';
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
  LinkRow,
  LinkRowChevron,
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('courses')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.offerings.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noCourses')}</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {data.offerings.map(offering => (
                <li key={offering.offeringId}>
                  <OfferingRow institutionId={institutionId} offering={offering} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
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
