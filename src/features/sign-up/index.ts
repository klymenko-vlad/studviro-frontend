/**
 * Public API of the sign-up slice.
 *
 * Everything importable from outside this slice is listed here. Deep imports
 * are an ESLint error, so an export missing from this file is invisible.
 */
export { SignUp } from './ui/sign-up';
export { buildSignUpSchema, type SignUpFormValues } from './model/sign-up';
