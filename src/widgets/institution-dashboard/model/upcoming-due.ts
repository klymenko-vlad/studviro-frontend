import type { Deadline } from '@/entities/deadline';
import type { PersonalTask } from '@/entities/planner';

export interface DueItem {
  key: string;
  title: string;
  courseCode: string | null;
  dueAt: string;
}

export function upcomingDue(
  deadlines: Deadline[],
  tasks: PersonalTask[],
  count: number,
): DueItem[] {
  return [
    ...deadlines.map(deadline => ({
      key: `deadline-${deadline.id}`,
      title: deadline.name,
      courseCode: deadline.course.code,
      dueAt: deadline.dueAt,
    })),
    ...tasks.flatMap(task =>
      task.dueAt === null || task.done
        ? []
        : [
            {
              key: `task-${task.id}`,
              title: task.title,
              courseCode: null,
              dueAt: task.dueAt,
            },
          ],
    ),
  ]
    .sort(
      (left, right) =>
        left.dueAt.localeCompare(right.dueAt) || left.key.localeCompare(right.key),
    )
    .slice(0, count);
}
