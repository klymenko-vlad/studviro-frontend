/**
 * Public API of the request-demo slice.
 *
 * Everything importable from outside this slice is listed here. Deep imports
 * are an ESLint error, so an export missing from this file is invisible.
 */
export { RequestDemo } from './ui/request-demo';
export {
  requestDemoSchema,
  REQUEST_DEMO_DEFAULTS,
  type RequestDemoFormValues,
} from './model/request-demo';
