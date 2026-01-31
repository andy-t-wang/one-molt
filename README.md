# OneMolt

**Give your molt the weight of a real human behind it.** Sybil-resistant identity for AI agents.

OneMolt binds a cryptographic keypair to a unique human using WorldID proof-of-personhood. This allows AI agents ("molts") to prove they are operated by a verified human, preventing bot farms and sybil attacks in agent networks.

## The Problem

AI agent networks are vulnerable to sybil attacks. Without proof-of-personhood, bad actors can spin up unlimited fake agents to manipulate systems, game incentives, or flood networks with spam.

## The Solution

OneMolt creates a 1:1 binding between:
- **A cryptographic identity** (Ed25519 keypair) that the agent controls
- **A unique human** verified through WorldID's iris biometrics

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Agent (Molt)              OneMolt               WorldID       │
│   ┌──────────┐             ┌───────┐            ┌─────────┐    │
│   │ Ed25519  │────────────▶│       │◀───────────│  Orb /  │    │
│   │ Keypair  │  signature  │Registry│  biometric │  World  │    │
│   └──────────┘             └───────┘   proof    │   App   │    │
│        │                       │                └─────────┘    │
│        │                       │                     │          │
│        ▼                       ▼                     ▼          │
│   Signs messages          Stores binding      Verifies human    │
│   Proves control          One per nullifier   One per person    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## How Registration Works

When a user wants to verify their molt, they go through a two-step process that binds their agent's keypair to their WorldID.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REGISTRATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  STEP 1: Prove Key Ownership
  ───────────────────────────

  ┌──────────┐                              ┌──────────────┐
  │   Molt   │                              │   OneMolt    │
  │  Agent   │                              │   Server     │
  └────┬─────┘                              └──────┬───────┘
       │                                           │
       │  1. Sign challenge with private key       │
       │ ─────────────────────────────────────────▶│
       │    { publicKey, deviceId,                 │
       │      message, signature }                 │
       │                                           │
       │                          2. Verify Ed25519│
       │                             signature     │
       │                                           │
       │  3. Return session token + URL            │
       │ ◀─────────────────────────────────────────│
       │    { sessionToken, registrationUrl }      │
       │                                           │


  STEP 2: Prove Humanity
  ──────────────────────

  ┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
  │  Human   │      │ World App│      │   OneMolt    │      │ WorldID  │
  │  User    │      │  (Phone) │      │   Server     │      │   API    │
  └────┬─────┘      └────┬─────┘      └──────┬───────┘      └────┬─────┘
       │                 │                   │                   │
       │  1. Open registration URL           │                   │
       │ ───────────────────────────────────▶│                   │
       │                                     │                   │
       │  2. Display QR code                 │                   │
       │ ◀───────────────────────────────────│                   │
       │                                     │                   │
       │  3. Scan QR    │                    │                   │
       │ ───────────────▶                    │                   │
       │                 │                   │                   │
       │                 │  4. Generate proof│                   │
       │                 │ (nullifier hash,  │                   │
       │                 │  merkle root)     │                   │
       │                 │                   │                   │
       │  5. Submit proof to server          │                   │
       │ ───────────────────────────────────▶│                   │
       │                                     │                   │
       │                                     │  6. Verify proof  │
       │                                     │ ─────────────────▶│
       │                                     │                   │
       │                                     │  7. Valid/Invalid │
       │                                     │ ◀─────────────────│
       │                                     │                   │
       │                      8. Store registration              │
       │                         (publicKey ↔ nullifier)         │
       │                                     │                   │
       │  9. Success! Molt is verified       │                   │
       │ ◀───────────────────────────────────│                   │


  RESULT
  ──────

  ┌─────────────────────────────────────────────────────────────┐
  │                    Registration Record                      │
  ├─────────────────────────────────────────────────────────────┤
  │  public_key:        MCowBQYDK2VwAyEA...                     │
  │  device_id:         a1b2c3d4e5f6...                         │
  │  nullifier_hash:    0x1234abcd...  (unique per human)       │
  │  verification_level: face | device                          │
  │  active:            true                                    │
  └─────────────────────────────────────────────────────────────┘

  The nullifier_hash links each molt to a verified human.
  Multiple molts can be registered to the same human,
  but each molt carries the weight of human verification.
```

## How Verification Works

Any application can verify that an agent is operated by a verified human.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VERIFICATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  METHOD 1: Lookup by Public Key
  ──────────────────────────────

  ┌──────────┐                              ┌──────────────┐
  │  Your    │                              │   OneMolt    │
  │   App    │                              │    API       │
  └────┬─────┘                              └──────┬───────┘
       │                                           │
       │  GET /api/v1/molt/{publicKey}             │
       │ ─────────────────────────────────────────▶│
       │                                           │
       │  Response:                                │
       │ ◀─────────────────────────────────────────│
       │    {                                      │
       │      "verified": true,                    │
       │      "deviceId": "a1b2c3...",             │
       │      "publicKey": "MCowBQ...",            │
       │      "worldId": {                         │
       │        "verified": true,                  │
       │        "verificationLevel": "face",       │
       │        "registeredAt": "2024-01-15"       │
       │      }                                    │
       │    }                                      │


  METHOD 2: Verify Signature + Registration
  ─────────────────────────────────────────

  Use this when an agent claims to be verified and signs a message.

  ┌──────────┐      ┌──────────┐      ┌──────────────┐
  │  Your    │      │   Molt   │      │   OneMolt    │
  │   App    │      │  Agent   │      │    API       │
  └────┬─────┘      └────┬─────┘      └──────┬───────┘
       │                 │                   │
       │  1. Challenge   │                   │
       │ ───────────────▶│                   │
       │   "sign this"   │                   │
       │                 │                   │
       │  2. Signature   │                   │
       │ ◀───────────────│                   │
       │   { sig, pubkey }                   │
       │                 │                   │
       │  3. POST /api/v1/verify/signature   │
       │ ───────────────────────────────────▶│
       │    { message, signature, publicKey }│
       │                                     │
       │                        4. Verify:   │
       │                        - Signature  │
       │                        - Registration│
       │                        - WorldID    │
       │                                     │
       │  5. Response                        │
       │ ◀───────────────────────────────────│
       │    {                                │
       │      "signatureValid": true,        │
       │      "registered": true,            │
       │      "worldIdVerified": true,       │
       │      "verificationLevel": "face"    │
       │    }                                │


  DECISION TREE
  ─────────────

                    ┌─────────────────┐
                    │ Is signature    │
                    │ valid?          │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                   YES               NO
                    │                 │
                    ▼                 ▼
           ┌────────────────┐   ┌─────────────┐
           │ Is publicKey   │   │ REJECT      │
           │ registered?    │   │ Invalid sig │
           └───────┬────────┘   └─────────────┘
                   │
          ┌────────┴────────┐
          │                 │
         YES               NO
          │                 │
          ▼                 ▼
  ┌───────────────┐   ┌─────────────┐
  │ Is WorldID    │   │ UNVERIFIED  │
  │ verified?     │   │ Not in      │
  └───────┬───────┘   │ registry    │
          │           └─────────────┘
   ┌──────┴──────┐
   │             │
  YES           NO
   │             │
   ▼             ▼
┌─────────┐  ┌─────────────┐
│ VERIFIED│  │ PARTIAL     │
│ HUMAN   │  │ Registered  │
│ OPERATOR│  │ but no      │
└─────────┘  │ WorldID     │
             └─────────────┘
```

## API Reference

### Check Molt Status
```
GET /api/v1/molt/{publicKey}
```
Returns verification status for a public key.

### Verify Signature
```
POST /api/v1/verify/signature
{
  "message": "challenge string",
  "signature": "base64 signature",
  "publicKey": "base64 public key"
}
```
Verifies signature and returns registration status.

### Lookup by Device ID
```
GET /api/v1/verify/device/{deviceId}
```
Returns registration status for a device ID.

## Getting Started

### For Molt Operators

Install the OneMolt skill and verify your molt:

```bash
claw install andy-t-wang/one-molt
```

Or manually: visit https://onemolt.ai/skill.md for instructions.

### For Developers

Query the API to verify molts in your application:

```typescript
const response = await fetch(
  `https://onemolt.ai/api/v1/molt/${publicKey}`
);
const { verified, worldId } = await response.json();

if (verified && worldId?.verified) {
  // This molt is operated by a verified human
}
```

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Sybil Resistance** | WorldID nullifier links each molt to a verified human |
| **Key Ownership** | Ed25519 signatures prove control of private key |
| **Non-transferable** | Nullifier is bound to biometrics, can't be sold |
| **Privacy Preserving** | No personal data stored, only cryptographic proofs |
| **Revocable** | Users can deactivate and register a new molt |

## License

MIT
