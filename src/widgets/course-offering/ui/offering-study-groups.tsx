'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  AddToStudyGroup,
  CloseStudyGroup,
  RemoveFromStudyGroup,
  StudyGroupForm,
} from '@/features/manage-study-groups';
import { courseRosterQueries, enrolledStudents } from '@/entities/course-roster';
import { usePermissions } from '@/entities/permission';
import { studyGroupQueries, unassigned } from '@/entities/study-group';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@/shared/ui';

export function OfferingStudyGroups({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('studyGroups');
  const { can } = usePermissions(institutionId);
  const manageable = can('offering:manage');

  const groups = useQuery(
    studyGroupQueries.list({ path: { institutionId, offeringId } }),
  );
  const roster = useQuery({
    ...courseRosterQueries.detail({ path: { institutionId, offeringId } }),
    enabled: manageable,
  });

  const students = roster.data === undefined ? [] : enrolledStudents(roster.data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {manageable ? (
          <StudyGroupForm institutionId={institutionId} offeringId={offeringId} />
        ) : null}

        {groups.isPending ? (
          <Skeleton className="h-20 w-full" data-testid="study-groups-loading" />
        ) : groups.isError ? (
          <p className="text-muted-foreground text-sm">{t('error')}</p>
        ) : groups.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-6" aria-label={t('title')}>
            {groups.data.map(group => (
              <li key={group.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{group.name ?? group.code}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {group.code}
                  </span>
                  <Badge variant="secondary">{t(`kind.${group.kind}`)}</Badge>
                  <Badge variant="outline">
                    {group.capacity === null
                      ? t('places.uncapped', { taken: group.members.length })
                      : t('places.capped', {
                          taken: group.members.length,
                          capacity: group.capacity,
                        })}
                  </Badge>
                  {manageable ? (
                    <CloseStudyGroup
                      institutionId={institutionId}
                      offeringId={offeringId}
                      groupId={group.id}
                      code={group.code}
                    />
                  ) : null}
                </div>

                {group.members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('noMembers')}</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {group.members.map(member => (
                      <li
                        key={member.userId}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>{member.displayName}</span>
                        {manageable ? (
                          <RemoveFromStudyGroup
                            institutionId={institutionId}
                            offeringId={offeringId}
                            groupId={group.id}
                            userId={member.userId}
                            displayName={member.displayName}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {manageable ? (
                  <AddToStudyGroup
                    institutionId={institutionId}
                    offeringId={offeringId}
                    group={group}
                    candidates={unassigned(students, group)}
                    rosterSize={students.length}
                  />
                ) : null}

                <Separator />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
