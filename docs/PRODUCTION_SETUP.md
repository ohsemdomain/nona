# Production Setup Guide

First-time setup for deploying Nona to Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI authenticated (`bunx wrangler login`)
- D1 database created in Cloudflare dashboard
- GitHub repo connected to Cloudflare Workers (for CI/CD)

## Step 1: Configure Secrets

Set required secrets for production. These are stored securely in Cloudflare and not in code.

```bash
# Generate and set better-auth secret (required for session encryption)
echo "$(openssl rand -base64 32)" | bunx wrangler secret put BETTER_AUTH_SECRET

# Generate and set session token secret (required for HMAC-signed tokens)
echo "$(openssl rand -base64 32)" | bunx wrangler secret put SESSION_TOKEN_SECRET
```

Verify secrets are set:
```bash
bunx wrangler secret list
```

Expected output:
```json
[
  { "name": "BETTER_AUTH_SECRET", "type": "secret_text" },
  { "name": "SESSION_TOKEN_SECRET", "type": "secret_text" }
]
```

## Step 2: Run Database Migration

Apply database schema to remote D1:

```bash
bun run db:migrate:prod
```

This creates all tables: `user`, `role`, `permission`, `session`, `account`, `category`, `item`, `order`, `order_line`, `audit_log`, `verification`.

Verify tables exist:
```bash
bunx wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

## Step 3: Seed RBAC Permissions

Insert the 21 default permissions:

```bash
bun run db:seed-rbac:prod
```

Verify permissions:
```bash
bunx wrangler d1 execute DB --remote --command "SELECT COUNT(*) as count FROM permission"
# Expected: { "count": 21 }
```

## Step 4: Create Admin User

Create the first admin user with full permissions:

```bash
ADMIN_EMAIL="your@email.com" ADMIN_PASSWORD="your-secure-password" bun run db:seed-admin:prod
```

Options:
- `ADMIN_EMAIL` (required): Admin login email
- `ADMIN_PASSWORD` (required): Admin login password
- `ADMIN_NAME` (optional): Display name, defaults to "Admin"

This script:
1. Creates "Admin" role if not exists
2. Assigns all 21 permissions to Admin role
3. Creates user with hashed password
4. Links user to Admin role

Verify admin created:
```bash
bunx wrangler d1 execute DB --remote --command "SELECT email, name FROM user"
```

## Step 5: Deploy Application

If using GitHub CI/CD, push to trigger deployment:
```bash
git push origin master
```

Or deploy manually:
```bash
bun run deploy
```

## Step 6: Verify Production

Test the deployed application:

```bash
# Health check
curl https://your-worker.workers.dev/api/health
# Expected: {"status":"ok"}

# Auth check (should return null when not logged in)
curl https://your-worker.workers.dev/api/auth/get-session
# Expected: null

# Test login
curl -X POST https://your-worker.workers.dev/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your-secure-password"}'
# Expected: {"token":"...","user":{...}}
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun run db:migrate:prod` | Apply migrations to remote D1 |
| `bun run db:seed-rbac:prod` | Seed permissions to remote |
| `bun run db:seed-admin:prod` | Create admin user on remote |
| `bun run db:reset:prod` | Reset remote DB (drop all tables) |
| `bunx wrangler secret put NAME` | Set a secret |
| `bunx wrangler secret list` | List all secrets |
| `bunx wrangler secret delete NAME` | Delete a secret |

## Troubleshooting

### 500 Error on `/api/auth/*`

**Cause**: Missing `BETTER_AUTH_SECRET`

**Fix**:
```bash
echo "$(openssl rand -base64 32)" | bunx wrangler secret put BETTER_AUTH_SECRET
```

### 503 Service Unavailable / Error 1102 on Login

**Cause**: CPU limit exceeded - bcrypt password hashing is CPU intensive and can exceed Cloudflare Workers free tier limits.

**Symptoms**:
- Error code 1102
- "Worker exceeded resource limits"
- Intermittent failures (some attempts succeed, others fail)

**Solutions**:
1. **Warm up with curl first** - Run curl login to warm up the worker, then login via browser:
   ```bash
   curl -X POST "https://your-worker.workers.dev/api/auth/sign-in/email" \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"your-password"}'
   ```
2. **Retry** - It's intermittent, usually works within 2-3 attempts
3. **Upgrade to Workers Paid** - Higher CPU limits ($5/month)

**Note**: This is a known limitation of CPU-intensive password hashing (bcrypt/argon2) on Cloudflare Workers free tier. Once logged in, subsequent requests don't require password hashing and work normally.

### "TRUSTED_ORIGIN" Error

**Cause**: Origin not in allowed list

**Fix**: Update `wrangler.jsonc` `env.production.vars.TRUSTED_ORIGIN` with your domain.

## Environment Configuration

Secrets (set via `wrangler secret put`):
- `BETTER_AUTH_SECRET` - Encryption key for better-auth
- `SESSION_TOKEN_SECRET` - HMAC key for session tokens

Environment variables (in `wrangler.jsonc`):
- `TRUSTED_ORIGIN` - Comma-separated allowed origins for CORS
