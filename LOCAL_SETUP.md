# BizilCore - Local Development Setup

## Requirements

- **Node.js** v20 or higher — Download from https://nodejs.org
- **npm** v10 or higher (comes with Node.js)

## Step-by-Step Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Prisma client

```bash
npx prisma generate
```

> This must be run after every `npm install`. Without it, you'll get a "Cannot find module '.prisma/client/default'" error.

### 3. Create your environment file

Copy `.env.example` to `.env.local`:

```bash
# On Windows (Command Prompt):
copy .env.example .env.local

# On Mac/Linux:
cp .env.example .env.local
```

Then open `.env.local` and fill in:

**`AUTH_SECRET`** — Generate a random secret by running:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as the value.

**`NEXTAUTH_URL`** — Set to `http://localhost:5000` (already set in the example).

### 4. Run the development server

```bash
npm run dev
```

Open **http://localhost:5000** in your browser.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '.prisma/client/default'` | Prisma client not generated | Run `npx prisma generate` |
| Login not working / server error on login | `AUTH_SECRET` not set | Add `AUTH_SECRET` to `.env.local` |
| `An unexpected response was received from the server` | Missing `AUTH_SECRET` causing auth crash | Add `AUTH_SECRET` to `.env.local` |
| Login takes very long | Supabase cold start + bcrypt hashing | Normal, wait 5–10 seconds on first login |
| `.next` folder errors | Old build cache | Delete `.next` folder and run `npm run dev` again |

---

## Database Schema Changes (Migrations)

All schema changes **must** go through Prisma Migrations. Never apply SQL directly to the Supabase database — doing so creates a mismatch between the database state and Prisma's migration history, which breaks `prisma migrate deploy` in CI/production.

### How to make a schema change

1. Edit `prisma/schema.prisma` to reflect the change you want.
2. Run the migration command to generate a migration file and apply it:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   This creates a file in `prisma/migrations/` and applies it to the database.
3. Commit both the updated `schema.prisma` and the new migration file together.

### Deploying schema changes

On Vercel / in CI, schema changes are applied with:
```bash
npm run migrate:deploy
```
This command is safe to run repeatedly — it only applies migrations that haven't been applied yet.

To verify the database is in sync before deploying (useful as a CI gate):
```bash
npm run migrate:check
```
This exits with a non-zero code if any migrations are pending, making it suitable as a build step or pre-deploy check that blocks deployment when the schema is out of date.

### What NOT to do

- **Do not** run raw `ALTER TABLE`, `CREATE TABLE`, or other DDL statements directly in Supabase's SQL editor or psql.
- **Do not** use `prisma db push` in a shared or production environment — it bypasses the migration history.
- **Do not** delete or edit existing files in `prisma/migrations/` after they have been applied to any database.

### If someone accidentally applied SQL directly

If the database already has a change that Prisma doesn't know about (migration stuck in failed/pending state), resolve it with:
```bash
npx prisma migrate resolve --applied <migration_name>
```
Replace `<migration_name>` with the folder name (e.g. `20260325000000_add_store_dhaka_fee`). This marks the migration as applied without re-running its SQL.

Verify the state is clean afterwards:
```bash
npx prisma migrate status
```
Expected output: `Database schema is up to date!`

---

## Notes

- The app uses a **shared Supabase database** (already configured). You do not need to set up your own database.
- Features like bKash, Nagad, Facebook, email, SMS, and AI require their respective API keys in `.env.local` to work. They are optional for basic usage.
- The app runs on **port 5000** by default.
