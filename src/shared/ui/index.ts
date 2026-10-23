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
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
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
export { Avatar, AvatarFallback } from './avatar';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
export { EmptyState } from './empty-state';
export { Input } from './input';
export { LoadMore } from './load-more';
export { Logo, LogoMark } from './logo';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
export { Label } from './label';
export { LinkRow, LinkRowChevron, ToneDot } from './link-row';
export { ListingCard, ListingNote } from './listing-card';
export { PageHeader, PageShell } from './page-shell';
export { PasswordInput } from './password-input';
export { Progress } from './progress';
export { QueryError } from './query-error';
export { Select, SelectItem } from './select';
export { Separator } from './separator';
export { ListSkeleton, Skeleton, TableSkeleton } from './skeleton';
export { Toaster } from './sonner';
export { Switch } from './switch';
export { Textarea } from './textarea';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
export {
  FileScanBadge,
  useUnscannedDownloadConfirm,
  type FileScanStatus,
} from './file-scan';
