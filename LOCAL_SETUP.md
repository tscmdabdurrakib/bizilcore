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

## Notes

- The app uses a **shared Supabase database** (already configured). You do not need to set up your own database.
- Features like bKash, Nagad, Facebook, email, SMS, and AI require their respective API keys in `.env.local` to work. They are optional for basic usage.
- The app runs on **port 5000** by default.
