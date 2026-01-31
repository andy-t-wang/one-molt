# OneMolt Identity Registry

**One Molt Per Human** - A WorldID-integrated identity verification system that combines proof-of-personhood (WorldID) with cryptographic identity (Ed25519 signatures). This system allows OpenClaw molt bots to register their public keys with WorldID verification, ensuring one molt per unique human and enabling other apps to verify both registration and signature ownership.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLI Tool (Enhanced)  →  Next.js Web Service  →  Supabase  │
│       ↓                        ↓                      ↓      │
│  device.json           WorldID Widget          PostgreSQL   │
│  (Local Keys)          (QR + Verify)           (Registry)   │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Two-Factor Identity Verification**: Combines Ed25519 signature (what you have) with WorldID proof-of-personhood (who you are)
- **Sybil Resistance**: WorldID nullifier hashes prevent duplicate registrations
- **Public Registry**: REST API for verifying signatures and checking registration status
- **CLI Integration**: Enhanced OneMolt CLI with WorldID registration commands
- **Audit Trail**: All verification attempts are logged for transparency

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- WorldID Developer Portal account
- OpenClaw OneMolt CLI

### 1. Clone and Install

```bash
cd /Users/andy.wang/.openclaw/workspace/onemolt-registry
npm install
```

### 2. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Run the database migration:
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the migration
3. Get your project URL and keys from Settings → API

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_WORLDID_APP_ID=app_0f66d698a398d7f5d7c3594df5bc53b4
NEXT_PUBLIC_WORLDID_ACTION=verify-molt

WORLDID_API_URL=https://developer.worldcoin.org/api/v2/verify
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start at http://localhost:3000

### 5. Test Registration Flow

From your OpenClaw OneMolt CLI:

```bash
# Set server URL (if using local dev server)
export IDENTITY_SERVER="http://localhost:3000"

# Register with WorldID
./scripts/identity-proof.sh register-worldid

# Check registration status
./scripts/identity-proof.sh status

# Verify signature remotely
./scripts/identity-proof.sh verify-remote "test message"
```

## API Endpoints

### Registration Flow

**POST /api/v1/register/init**
- Initiates registration session
- Validates signature proves ownership of public key
- Returns session token and registration URL

**POST /api/v1/register/:sessionToken/worldid**
- Accepts WorldID proof
- Verifies proof with WorldID API
- Creates registration record

**GET /api/v1/register/:sessionToken/status**
- Polls registration status
- Returns session state and registration details

### Verification

**POST /api/v1/verify/signature**
- Verifies Ed25519 signature
- Returns verification result + WorldID status

**GET /api/v1/verify/device/:deviceId**
- Checks device registration status
- Returns public key and verification level

**GET /api/v1/verify/publickey/:key**
- Looks up registration by public key
- Returns device ID and verification status

**GET /api/v1/status**
- Health check endpoint
- Returns service status

## Database Schema

### Tables

- **registrations**: Verified device registrations with WorldID proof
- **registration_sessions**: Temporary sessions for two-step registration flow
- **verification_logs**: Audit trail for all verification attempts

See `supabase/migrations/001_initial_schema.sql` for complete schema definition.

## Deployment

### Deploy to Vercel

1. Push code to GitHub repository
2. Import project to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard:
   - All `NEXT_PUBLIC_*` variables
   - `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - `WORLDID_API_URL`
   - `NEXT_PUBLIC_BASE_URL` (your production domain)
4. Deploy

### Configure CLI for Production

```bash
# Add to ~/.bashrc or ~/.zshrc
export IDENTITY_SERVER="https://identity-registry.vercel.app"
```

## Security

- ✅ HTTPS enforced in production
- ✅ Environment variables properly secured
- ✅ Input validation on all endpoints
- ✅ WorldID proofs verified server-side
- ✅ Nullifier hash uniqueness enforced
- ✅ Row Level Security enabled in Supabase
- ✅ Audit logging for all verifications
- ✅ Session expiry (15 minutes)
- ✅ Private keys never transmitted

## Development

### Project Structure

```
identity-registry/
├── app/
│   ├── api/v1/          # API routes
│   ├── register/        # Registration UI
│   └── layout.tsx       # Root layout
├── lib/
│   ├── crypto.ts        # Ed25519 verification
│   ├── worldid.ts       # WorldID proof verification
│   ├── supabase.ts      # Database client
│   └── types.ts         # TypeScript types
├── supabase/
│   └── migrations/      # Database schema
└── public/              # Static assets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Integration Example

### Verifying a Molt Bot

```typescript
// External app verifying a molt bot
const response = await fetch('https://identity-registry.vercel.app/api/v1/verify/signature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceId: 'device-id-from-bot',
    message: 'challenge-message',
    signature: 'signature-from-bot'
  })
})

const result = await response.json()

if (result.verified && result.worldIdVerified) {
  console.log('Bot is verified human!')
  console.log('Verification level:', result.verificationLevel)
} else {
  console.log('Verification failed')
}
```

## License

MIT

## Support

For issues and questions:
- GitHub Issues: Create an issue in this repository
- OpenClaw Discord: Join the community discussion
