/**
 * The public API of the design system.
 *
 * Everything here is shadcn/ui (`pnpm dlx shadcn@latest add <name>`), sitting on
 * the tokens in `src/app/globals.css`. Consumers import from `@/shared/ui` and
 * never reach into a component file directly, so a component can be swapped or
 * re-generated without touching a single call site.
 *
 * **This barrel is the bundle.** Every client component named here lands in the
 * shared client chunk on every route, whether or not a page renders it —
 * Turbopack cannot tree-shake across a `'use client'` re-export. So the list
 * below is *adopted components only*, not everything vendored in this folder.
 * Adding a component: `shadcn add <name>`, use it, then add the export here.
 * Removing the last call site: remove the export too.
 */
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Badge, badgeVariants } from './badge';
export { Button, buttonVariants } from './button';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './form';
export { Input } from './input';
export { Label } from './label';
export { PasswordInput } from './password-input';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export { Toaster } from './sonner';
export { Switch } from './switch';
export { Textarea } from './textarea';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
