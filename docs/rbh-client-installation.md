# RBH WhatsApp CRM: dedicated client installation

This guide is for RBH's one-time setup and maintenance offering: deploy one
application and one Supabase project for each client. The client manages their
own WhatsApp Business account and number. This repository contains no central
RBH billing, client suspension, or SaaS administration panel.

## Before taking live traffic

The current RBH changes have automated tests, but have **not** been validated
end to end against a production Meta WhatsApp number. Complete the acceptance
checks below on a staging deployment and review the Supabase Security Advisor
findings before storing client data or promising production support.

1. Agree who owns the domain, hosting, Supabase project, Meta Business portfolio,
   number, and billing accounts; document administrative access and handover.
2. Use a dedicated Supabase project and dedicated app deployment for the client.
   Do not reuse RBH's development database, encryption key, or Meta credentials.
3. Install Node.js 22.23.4 or a compatible supported version satisfying
   `package.json`, then run `npm ci`. The lockfile must be retained.
4. Create a Supabase project in the agreed region. Apply **all** SQL files in
   `supabase/migrations/` in filename order to a fresh project, including the
   RBH modifications. Do not apply the initial schema over an existing client's
   database. Verify the resulting schema and migrations before proceeding.
   Newly created Supabase projects may require explicit Data API grants in
   addition to row-level security. Verify only the needed authenticated and
   server-side privileges, keeping RLS enabled; never grant broad public access
   just to make a query work.
5. Copy `.env.local.example` to `.env.local` for development or use the hosting
   provider's secret manager for production. Set `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key),
   `SUPABASE_SERVICE_ROLE_KEY` (server secret), `META_APP_SECRET`, and the
   production `NEXT_PUBLIC_SITE_URL`. Set `META_APP_ID` when needed for Meta
   media-template submission. Generate a unique 32-byte hexadecimal
   `ENCRYPTION_KEY` and back it up securely: changing or losing it makes
   previously encrypted credentials unreadable. Never commit `.env.local`,
   keys, customer data, or dumps to GitHub.
6. Set Supabase Auth's site and redirect URLs to the client's HTTPS domain,
   configure a production email provider, and restrict account registration to
   the client's intended users. Enable email confirmation as appropriate. A
   publicly reachable signup page can otherwise create new CRM accounts.
7. Build and deploy the application with HTTPS. Use the client's own Meta
   Business portfolio, approved phone number, WhatsApp Business Account and
   an appropriately scoped access token. Configure the app's WhatsApp settings,
   Meta webhook callback and verification token. Configure the flow and
   automation cron endpoints with their corresponding secrets and schedules.
   See the [upstream deployment guide](https://wacrm.tech/docs) for setup details;
   use this repository's modified SQL, not upstream's unmodified migrations.
8. Configure monitoring, encrypted backups, a restore procedure, retention and
   deletion rules, update ownership, and support contacts. Document costs for
   hosting, Supabase, Meta messaging, AI and third-party services separately.

## Acceptance checks

- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Verify signup, sign-in, password reset, roles, invitations, and logout.
- Verify RLS and Data API grants with two separate test users/accounts: neither
  can read or change the other's data, files or API resources. Do not rely on
  unit tests or the Admin API alone for this check.
- Confirm `avatars`, `chat-media`, and `flow-media` buckets are private. Test
  uploads, previews, downloads, inbound media, outbound media, flow media and
  template headers with a real Meta test number. Check short-lived URLs expire
  and unauthorized requests fail. Test template submission and broadcasts too.
- Send and receive a WhatsApp test message; verify delivery/read status,
  webhook signatures, templates, automation scheduling, failure handling,
  and a subsequent restart. Avoid real customer data during testing.
- Run Supabase security advisors, review all findings and resolve or document
  each one. Test backup restoration and client handover before launch.

## Licensing

Retain the original WACRM copyright and MIT `LICENSE` when distributing copies.
The bundled shadcn stylesheet has a separate MIT notice at
`src/app/SHADCN-LICENSE.txt`. Audit other dependency licences before release.
