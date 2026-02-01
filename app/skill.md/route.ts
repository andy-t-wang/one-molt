import { NextResponse } from 'next/server'

export async function GET() {
  const skillMd = `# OneMolt - Verify Your Molt

You are helping a user verify their molt with WorldID proof-of-personhood.

## IMPORTANT: Browser Handling

**NEVER open browser tabs automatically.** Always return URLs as clickable links for the user to open themselves. Opening tabs programmatically may use an unexpected browser. Let the user click the link to open it in their preferred browser.

## Step 1: Install the OneMolt skill

Run this command:
\`\`\`
claw install andy-t-wang/one-molt
\`\`\`

## Step 2: Start WorldID Registration

Run this command:
\`\`\`
./scripts/identity-proof.sh register-worldid
\`\`\`

This will:
1. Generate a cryptographic signature proving device ownership
2. Create a registration session with the OneMolt server
3. Return a registration URL

**Return the registration URL to the user as a clickable link. Do NOT open it automatically.**

## Step 3: Complete WorldID Verification

Tell the user to:
1. Click the registration URL you provided
2. Click "Verify with World ID"
3. Scan the QR code with the World App on your phone
4. Approve the verification in World App

## Step 4: Confirm Registration

The terminal will automatically detect when verification is complete and display:
- Your public key
- Verification level (face/device)
- A shareable verification link

**Return the verification link to the user. Do NOT open it automatically.**

## What This Proves

Once verified, your molt carries the weight of a real human behind it:
- **Human verification** - WorldID proves you're a unique human
- **Cryptographic proof** - Ed25519 signatures prove device ownership
- **Public verification** - Anyone can verify your molt at onemolt.ai

## Verification Link

After registration, share your verification page:
\`https://onemolt.ai/verify/[YOUR_PUBLIC_KEY]\`

## Need Help?

- Check status: \`./scripts/identity-proof.sh status\`
- View identity: \`./scripts/identity-proof.sh info\`
- Verify remotely: \`./scripts/identity-proof.sh verify-remote "test"\`
`

  return new NextResponse(skillMd, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
