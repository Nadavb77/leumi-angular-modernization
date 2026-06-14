---
name: testing-angular-app
description: Test the Angular hero management app end-to-end. Use when verifying Angular upgrades, UI changes, or runtime behavior.
---

# Testing the Angular App

## Prerequisites

- Node.js version matching `.nvmrc` (currently 20)
- Dependencies installed via `npm ci`

## Running the Dev Server

```bash
# English locale (default)
npx ng serve --configuration=development-en --port=4200

# Spanish locale
npx ng serve --configuration=development-es --port=4200
```

The app compiles and serves at `http://localhost:4200`.

## App Structure & Routes

- `/` → redirects to `/auth/log-in`
- `/auth/log-in` → Login page (email + password form)
- `/auth/register` → Registration page (first name + email + password + terms)
- `/auth/logout` → Logout handler
- `/user/...` → Protected user routes (requires auth)
- `/404` → Error page

Auth routes are lazy-loaded. The NoAuthGuard blocks authenticated users from login/register pages.

## Backend

The app connects to a GraphQL backend at the URL configured in `src/environments/environment.ts`:
- Dev: `https://nestjs-example-app.onrender.com/graphql`
- The backend may be cold-started (Render free tier), so first requests might be slow
- The app renders and navigates fine without backend connectivity — API calls will fail but UI is functional

## Key UI Elements to Verify

### Login Page (`/auth/log-in`)
- Heading: "¡Welcome back!"
- Email input (placeholder: "name@example.com")
- Password input
- "Enter" submit button
- "register" navigation link
- Language selector dropdown (EN button, top-right) with Español/English options
- Angular logo image

### Register Page (`/auth/register`)
- Heading: "¡Register, and create your first hero!"
- First name, Email, Password inputs
- Terms & conditions checkbox
- "Register" button
- "log in" navigation link back

### Form Validation
- Submitting empty login form shows: "Field required" on both fields, "Format invalid. example@domain.com" on email
- Fields highlight red with error icons
- Uses Angular reactive forms (FormGroup/FormControl)

## Validation Suite (Shell)

```bash
npm run lint      # ESLint + Stylelint
npm run test      # Karma/Jasmine unit tests with coverage
npm run build     # Production build (en + es locales)
npm run extract   # i18n extraction via ng-extract-i18n-merge
```

## Runtime Smoke Test Checklist

1. Navigate to `http://localhost:4200` → should redirect to `/auth/log-in`
2. Login page renders all elements (heading, form, inputs, button, links, language selector)
3. Click "register" → navigates to `/auth/register` (lazy-loaded module)
4. Register page renders all elements
5. Click "log in" → navigates back to `/auth/log-in`
6. Browser console: zero ERROR-level messages (Apollo DevTools info log is expected)
7. Click "Enter" on empty form → validation errors appear
8. Language selector dropdown opens with Español/English

## Known Warnings (Not Errors)

- Sass `@import` deprecation warnings (will need migration to `@use`/`@forward` for Dart Sass 3.0)
- Apollo DevTools suggestion log in console (info-level)
- `@typescript-eslint` may warn about TS version support

## Tips

- Use `nvm use` to switch to the correct Node version before running commands
- The app uses npm overrides for `ng-extract-i18n-merge` peer dep (see package.json)
- Bundle budget is set to 900Kb in angular.json
- If the backend is down, the app still loads — GraphQL errors won't prevent UI testing
