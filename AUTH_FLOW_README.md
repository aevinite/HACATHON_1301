# HackJudge Auth Flow Documentation

## Current Auth Flow
This project uses Supabase Auth with:
- Email/password + OTP verification
- Google OAuth login/signup

## Email/Password Signup Flow
1. User enters full name, email, and password on `/signup`
2. Form validation checks password requirements (8+ chars, 1 uppercase, 1 lowercase, 1 number)
3. If email exists and is already verified: Error "An account with this email already exists. Please sign in instead."
4. If email exists but is unverified:
   - Update pending user's password and full_name
   - Resend signup OTP
   - Redirect to `/verify-otp?email=<email>&message=new_otp`
5. If email is new:
   - Create Supabase Auth user with full_name in user_metadata
   - Send signup OTP
   - Redirect to `/verify-otp?email=<email>`

## OTP Verification Flow
1. User is on `/verify-otp?email=<email>`
2. User enters OTP from email
3. OTP is trimmed of all whitespace
4. verifyOtpAction tries verification with type "signup"
5. If success:
   - Create/verify profile in `profiles` table with role "team"
   - Redirect to `/dashboard`
6. If failure: Show specific error message (invalid/expired/already used)
7. Resend button:
   - Resends signup OTP
   - Disables button for 60 seconds
   - Shows success message that auto-hides after 4 seconds

## Login Flow
1. User enters email and password on `/login`
2. If email has no verified account: Error "No verified account exists for this email. Please sign up and verify your email."
3. If email has verified account:
   - Try password login
   - If success: Redirect to appropriate dashboard based on role
   - If failure: Error "Incorrect password."
4. Demo accounts are available for quick testing

## Pending/Unverified User Behavior
- Unverified users are treated as pending, not real accounts
- Someone can sign up again with the same email while it's pending
- The latest signup's password and full_name overwrite the pending user
- Whoever verifies the OTP first owns the account
- Unverified users cannot login

## Forgot Password/Reset Password Flow
1. User goes to `/forgot-password`
2. Enters email address
3. If verified account exists: Sends password reset email with redirect to `/reset-password`
4. Shows generic success message (prevents email enumeration)
5. User clicks reset link, goes to `/reset-password`
6. Enters new password twice
7. Password is updated, user is redirected to login

## Google OAuth Flow
1. User clicks "Continue with Google" (login) or "Sign up with Google" (signup)
2. Browser redirects to Google OAuth consent screen
3. User signs in/grants permission to Google
4. Google redirects to Supabase callback URL
5. Supabase redirects back to app callback at `/auth/callback`
6. Callback route exchanges code for session
7. If no profile exists for the user, creates one with role "team"
8. Redirects to `/dashboard`
9. Google OAuth users skip OTP verification (already verified by Google)

## Required Supabase Settings
- Project ref: `whiwambrrchcezjoprgi`
- Email provider enabled
- Email confirmation enabled
- Google provider enabled
- Confirm signup email template includes `{{ .Token }}` (for OTP)
- SMTP configured
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://your-vercel-app.vercel.app/**`
  - `https://yourdomain.com/**`

## Required Google Cloud Settings
- Google Authorized redirect URI: `https://whiwambrrchcezjoprgi.supabase.co/auth/v1/callback`
- Google Authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://your-vercel-app.vercel.app`
  - `https://yourdomain.com`
- Google OAuth Client ID and Secret configured in Supabase → Authentication → Providers → Google

## Common Google OAuth Errors and Fixes
- **OAuth failed error on callback**:
  - Check that Google provider is enabled in Supabase
  - Verify Google Client ID and Secret are correctly set
  - Confirm Google Authorized redirect URI matches exactly
- **Google consent screen issues**:
  - Verify Google Authorized JavaScript origins include your domain
  - Make sure your Google Cloud project has the correct OAuth consent screen configured
- **Profile not created for Google user**:
  - Check profiles table permissions
  - Verify callback route is accessible


## Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://whiwambrrchcezjoprgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # for local
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # for production
```

## Manual Testing Steps
1. Delete test user from Supabase Auth
2. Open `/signup`
3. Enter name A, email1, valid password A
4. Confirm redirect to `/verify-otp?email=email1`
5. Enter wrong OTP - confirm error message
6. Resend OTP - confirm button disabled for 60s and message appears/hides
7. Enter correct OTP - confirm dashboard opens
8. Check profiles table has role "team"
9. Logout
10. Login with email1 + password A - confirm success
11. Try login with wrong password - confirm "Incorrect password"
12. Try login with unverified email - confirm correct error message
13. Test forgot password flow

## Common Errors and Fixes
- **"Invalid or expired verification code"**:
  - Make sure you're using the latest OTP
  - Check token is trimmed correctly
  - Verify email in URL matches the one you signed up with
- **"NEXT_REDIRECT" error in logs**:
  - This is normal - Next.js uses this for redirects
- **No verified account error when you have an account**:
  - Check Supabase Auth → Users and confirm email_confirmed_at is set
- **Profile not created**:
  - Check profiles table has correct permissions

## Important Security Notes
- **SUPABASE_SERVICE_ROLE_KEY**: Server-only, never expose in client code or public repos
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Public-safe, used for client-side operations
- **Google Client Secret**: Only store in Supabase/secure environment variables, never in frontend code
- **Email enumeration**: Forgot password flow uses generic success message to prevent this
- **Unverified accounts**: Treated as pending to prevent account takeovers
