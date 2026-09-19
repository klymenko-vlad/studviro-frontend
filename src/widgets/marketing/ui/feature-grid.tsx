import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export interface FeatureItem {
  key: string;
  title: string;
  body: string;
}

interface FeatureGridProps {
  items: readonly FeatureItem[];
  columns?: 2 | 3;
}

export function FeatureGrid({ items, columns = 3 }: FeatureGridProps) {
  return (
    <ul
      className={
        columns === 2
          ? 'grid gap-4 sm:grid-cols-2'
          : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      }
    >
      {items.map(item => (
        <li key={item.key} className="flex">
          <Card className="w-full gap-3">
            <CardHeader>
              <CardTitle as="h3" className="text-base">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm text-pretty">
              {item.body}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
