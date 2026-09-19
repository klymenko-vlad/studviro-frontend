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
export { Input } from './input';
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
export { ListingCard, ListingNote } from './listing-card';
export { PasswordInput } from './password-input';
export { Progress } from './progress';
export { Select, SelectItem } from './select';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export { Toaster } from './sonner';
export { Switch } from './switch';
export { Textarea } from './textarea';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
