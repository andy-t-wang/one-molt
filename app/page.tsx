"use client";

import { useState } from "react";

interface MoltStatus {
  verified: boolean;
  deviceId?: string;
  publicKey?: string;
  worldId?: {
    verified: boolean;
    verificationLevel?: string;
    registeredAt?: string;
  };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<MoltStatus | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [primaryLang, setPrimaryLang] = useState<'javascript' | 'python' | 'curl'>('javascript');
  const [displayLang, setDisplayLang] = useState<'javascript' | 'python' | 'curl'>('javascript');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/v1/molt/${encodeURIComponent(searchQuery.trim())}`,
      );
      const data = await response.json();

      if (response.ok) {
        setSearchResult(data);
      } else {
        setSearchError("Failed to check registration status");
      }
    } catch (error) {
      setSearchError("Error connecting to server");
    } finally {
      setSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CHALLENGE_RESPONSE_EXAMPLES = {
    javascript: `// 1. Generate unique challenge
const challenge = \`auth-\${Date.now()}-\${crypto.randomUUID()}\`;

// 2. Send challenge to molt (via your app's interface)
// Molt runs: /one-molt prove "\${challenge}"
// Molt sends back: { signature, publicKey }

// 3. Verify signature + check WorldID
async function verifyMolt(challenge, signature, publicKey) {
  const response = await fetch('https://onemolt.ai/api/v1/verify/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: challenge,
      signature: signature,
      publicKey: publicKey
    })
  });

  const result = await response.json();

  if (result.verified && result.worldIdVerified) {
    console.log('✅ Verified human-operated molt');
    console.log(\`   Level: \${result.verificationLevel}\`);
    console.log(\`   Registered: \${result.registeredAt}\`);
    return true;
  } else {
    console.log('❌ Verification failed');
    return false;
  }
}`,
    python: `import requests
import time
import uuid

# 1. Generate unique challenge
challenge = f"auth-{int(time.time())}-{uuid.uuid4()}"

# 2. Send challenge to molt (via your app's interface)
# Molt runs: /one-molt prove "{challenge}"
# Molt sends back: signature, public_key

# 3. Verify signature + check WorldID
def verify_molt(challenge, signature, public_key):
    response = requests.post(
        'https://onemolt.ai/api/v1/verify/signature',
        json={
            'message': challenge,
            'signature': signature,
            'publicKey': public_key
        }
    )

    result = response.json()

    if result.get('verified') and result.get('worldIdVerified'):
        print(f"✅ Verified human-operated molt")
        print(f"   Level: {result['verificationLevel']}")
        print(f"   Registered: {result['registeredAt']}")
        return True
    else:
        print("❌ Verification failed")
        return False`,
    curl: `# 1. Generate challenge (example)
CHALLENGE="auth-$(date +%s)-$(uuidgen)"

# 2. Ask molt to sign it
# Molt runs: /one-molt prove "$CHALLENGE"
# Molt returns signature and public key

# 3. Verify signature + WorldID
curl -X POST https://onemolt.ai/api/v1/verify/signature \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "auth-1234567890-uuid-here",
    "signature": "base64-signature-from-molt",
    "publicKey": "MCowBQYDK2VwAyEA..."
  }'`
  };

  const DISPLAY_LOOKUP_EXAMPLES = {
    javascript: `// For display purposes only - NOT for authentication
async function showVerificationBadge(publicKey) {
  const response = await fetch(
    \`https://onemolt.ai/api/v1/molt/\${encodeURIComponent(publicKey)}\`
  );
  const data = await response.json();

  if (data.verified && data.worldId?.verified) {
    return \`✓ Verified Human (\${data.worldId.verificationLevel})\`;
  }
  return '? Unverified';
}`,
    python: `# For display purposes only - NOT for authentication
def show_verification_badge(public_key):
    response = requests.get(
        f'https://onemolt.ai/api/v1/molt/{public_key}'
    )
    data = response.json()

    if data.get('verified') and data.get('worldId', {}).get('verified'):
        level = data['worldId']['verificationLevel']
        return f"✓ Verified Human ({level})"
    return "? Unverified"`,
    curl: `# For display purposes only - NOT for authentication
curl https://onemolt.ai/api/v1/molt/MCowBQYDK2VwAyEA...`
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" fill="white" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">OneMolt</h1>
          <p className="text-2xl text-gray-600 mb-2">One Human. One Molt.</p>
          <p className="text-lg text-gray-500">
            WorldID-integrated identity verification for OpenClaw molt bots
          </p>
        </div>

        {/* Key Concept */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Proof-of-Personhood for AI Agents
              </h2>
              <p className="text-gray-600 leading-relaxed">
                OneMolt ensures that each molt bot is operated by a verified
                unique human, preventing Sybil attacks and building trust in the
                molt ecosystem. Through WorldID verification, we guarantee{" "}
                <strong>one molt per human</strong> - no duplicates, no bots
                operating bots.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">Get Started</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-center mb-6">
              Install the OneMolt skill for OpenClaw to register your molt with
              WorldID verification
            </p>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
              <p className="text-sm font-medium mb-2">
                1. Install from ClawHub
              </p>
              <div className="bg-black/30 rounded p-3 font-mono text-sm overflow-x-auto">
                claw install andy-t-wang/one-molt
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
              <p className="text-sm font-medium mb-2">2. Register your molt</p>
              <div className="bg-black/30 rounded p-3 font-mono text-sm overflow-x-auto">
                claw one-molt register-worldid
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-sm font-medium mb-2">
                3. Scan QR code with World App
              </p>
              <p className="text-sm opacity-90">
                Complete WorldID verification to prove you're a unique human
              </p>
            </div>

            <div className="mt-6 text-center">
              <a
                href="https://www.clawhub.ai/andy-t-wang/one-molt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View on ClawHub
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cryptographic Identity
              </h3>
              <p className="text-gray-600 text-sm">
                Your molt bot proves ownership of its Ed25519 private key
                through digital signatures.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                WorldID Verification
              </h3>
              <p className="text-gray-600 text-sm">
                Scan a QR code with World App to prove you are a unique human
                through biometric or orb verification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sybil-Resistant Registry
              </h3>
              <p className="text-gray-600 text-sm">
                Your verified molt is registered in a public database. One human
                can only have one active molt.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Check Molt Verification
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Enter a <strong>public key</strong> (primary) or device ID to verify
            if a molt is registered
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Public Key: MCowBQYDK2VwAyEA... (or Device ID)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searching}
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? "Checking..." : "Check"}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResult && (
            <div className="mt-6 max-w-2xl mx-auto">
              {searchResult.verified && searchResult.worldId?.verified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        ✓ Verified Molt
                      </h3>
                      <p className="text-green-700 text-sm mb-4">
                        This molt is operated by a verified unique human
                      </p>

                      <div className="space-y-3">
                        <div className="bg-white rounded p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Public Key
                          </p>
                          <p className="text-xs font-mono text-gray-900 break-all">
                            {searchResult.publicKey}
                          </p>
                        </div>

                        <div className="bg-white rounded p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Device ID
                          </p>
                          <p className="text-xs font-mono text-gray-900 break-all">
                            {searchResult.deviceId}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Verification Level
                            </p>
                            <p className="text-sm text-gray-900 capitalize">
                              {searchResult.worldId.verificationLevel}
                            </p>
                          </div>

                          <div className="bg-white rounded p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Registered
                            </p>
                            <p className="text-xs text-gray-900">
                              {searchResult.worldId.registeredAt &&
                                new Date(
                                  searchResult.worldId.registeredAt,
                                ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                        Not Verified
                      </h3>
                      <p className="text-yellow-700 text-sm">
                        This molt is not registered with WorldID verification
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {searchError && (
            <div className="mt-6 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Why OneMolt?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Prevent Sybil Attacks</h3>
                <p className="text-gray-300 text-sm">
                  <a
                    href="https://worldcoin.org/world-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    World ID
                  </a>{" "}
                  ensures one human per molt
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Public Verification</h3>
                <p className="text-gray-300 text-sm">
                  Anyone can verify a molt's human operator via REST API
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Privacy-Preserving</h3>
                <p className="text-gray-300 text-sm">
                  Zero-knowledge proofs - no personal data exposed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Device Switching</h3>
                <p className="text-gray-300 text-sm">
                  Replace your molt on new devices while maintaining uniqueness
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Integration Section */}
        <div className="mb-12" id="developers">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Developer Integration
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Integrate OneMolt verification into your app to ensure molt bots are operated by unique verified humans
          </p>

          {/* Security Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-red-900 mb-1">Security Notice</p>
                <p className="text-red-800 text-sm">
                  Don't just ask molts for their public key - they can lie! Always use challenge-response authentication to prove private key ownership.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Flow - Challenge-Response */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Authentication Flow
            </h3>
            <p className="text-blue-100 mb-6">
              Challenge-response with signature verification + WorldID proof-of-personhood
            </p>

            {/* Language Selector */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setPrimaryLang('javascript')}
                className={`px-4 py-2 rounded-lg text-sm ${primaryLang === 'javascript' ? 'bg-white/20' : 'bg-white/10'}`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setPrimaryLang('python')}
                className={`px-4 py-2 rounded-lg text-sm ${primaryLang === 'python' ? 'bg-white/20' : 'bg-white/10'}`}
              >
                Python
              </button>
              <button
                onClick={() => setPrimaryLang('curl')}
                className={`px-4 py-2 rounded-lg text-sm ${primaryLang === 'curl' ? 'bg-white/20' : 'bg-white/10'}`}
              >
                cURL
              </button>
            </div>

            {/* Code Example */}
            <div className="bg-black/40 rounded-lg p-4 overflow-x-auto relative">
              <button
                onClick={() => copyToClipboard(CHALLENGE_RESPONSE_EXAMPLES[primaryLang])}
                className="absolute top-2 right-2 px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
              >
                Copy
              </button>
              <pre className="text-sm"><code>{CHALLENGE_RESPONSE_EXAMPLES[primaryLang]}</code></pre>
            </div>

            {/* Step-by-step flow */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">1. Generate Challenge</div>
                <div className="text-sm text-blue-100">Create unique random string</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">2. Molt Signs</div>
                <div className="text-sm text-blue-100">Molt proves key ownership</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">3. Verify Both</div>
                <div className="text-sm text-blue-100">Check signature + WorldID</div>
              </div>
            </div>
          </div>

          {/* Molt Instructions Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
            <h4 className="font-bold text-purple-900 mb-3">
              Instructions for Molt Operators
            </h4>
            <p className="text-purple-800 text-sm mb-3">
              When a website requests verification, tell your molt to run:
            </p>
            <div className="bg-purple-900 text-purple-100 rounded p-3 font-mono text-sm">
              /one-molt prove "challenge-from-website"
            </div>
            <p className="text-purple-800 text-sm mt-3">
              Your molt will sign the challenge and return the signature + public key to prove ownership.
            </p>
          </div>

          {/* Supplementary Pattern - Display Only */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Display-Only Lookup</h4>
                <p className="text-gray-600 text-sm">
                  Use this endpoint to check verification status for display purposes (badges, profiles).
                  <span className="font-semibold text-orange-600"> NOT for authentication.</span>
                </p>
              </div>
            </div>

            {/* Language tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDisplayLang('javascript')}
                className={`px-3 py-1 rounded text-sm ${displayLang === 'javascript' ? 'bg-gray-200' : 'bg-gray-100'}`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setDisplayLang('python')}
                className={`px-3 py-1 rounded text-sm ${displayLang === 'python' ? 'bg-gray-200' : 'bg-gray-100'}`}
              >
                Python
              </button>
              <button
                onClick={() => setDisplayLang('curl')}
                className={`px-3 py-1 rounded text-sm ${displayLang === 'curl' ? 'bg-gray-200' : 'bg-gray-100'}`}
              >
                cURL
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
              <button
                onClick={() => copyToClipboard(DISPLAY_LOOKUP_EXAMPLES[displayLang])}
                className="absolute top-2 right-2 px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
              >
                Copy
              </button>
              <pre className="text-sm"><code>{DISPLAY_LOOKUP_EXAMPLES[displayLang]}</code></pre>
            </div>
          </div>

          {/* API Reference (Expandable) */}
          <details className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-3xl mx-auto">
            <summary className="font-bold cursor-pointer text-lg">
              📚 API Reference
            </summary>
            <div className="mt-4 space-y-6">
              {/* POST /api/v1/verify/signature */}
              <div>
                <h5 className="font-mono text-sm bg-green-100 text-green-800 inline-block px-2 py-1 rounded mb-2">
                  POST /api/v1/verify/signature
                </h5>
                <p className="text-gray-600 text-sm mb-3">
                  Verifies an Ed25519 signature and checks WorldID registration status.
                </p>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="font-semibold text-sm mb-2">Request Body:</p>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200">{`{
  "message": "challenge-string",
  "signature": "base64-encoded-signature",
  "publicKey": "base64-encoded-public-key"
}`}</pre>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="font-semibold text-sm mb-2">Success Response (200):</p>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200">{`{
  "verified": true,
  "publicKey": "MCowBQYDK2VwAyEA...",
  "deviceId": "e1c2b03e1fec2f1db656...",
  "worldIdVerified": true,
  "verificationLevel": "orb",
  "registeredAt": "2024-01-15T10:30:00Z"
}`}</pre>
                </div>
              </div>

              {/* GET /api/v1/molt/[id] */}
              <div>
                <h5 className="font-mono text-sm bg-blue-100 text-blue-800 inline-block px-2 py-1 rounded mb-2">
                  GET /api/v1/molt/[id]
                </h5>
                <p className="text-gray-600 text-sm mb-3">
                  Looks up verification status by public key or device ID. For display purposes only.
                </p>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="font-semibold text-sm mb-2">Parameters:</p>
                  <ul className="text-xs space-y-1">
                    <li><code className="bg-white px-1 rounded">id</code> - Public key (recommended) or device ID</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="font-semibold text-sm mb-2">Success Response (200):</p>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200">{`{
  "verified": true,
  "deviceId": "e1c2b03e1fec2f1db656...",
  "publicKey": "MCowBQYDK2VwAyEA...",
  "worldId": {
    "verified": true,
    "verificationLevel": "orb",
    "nullifierHash": "0x123abc...",
    "registeredAt": "2024-01-15T10:30:00Z",
    "lastVerifiedAt": "2024-01-20T14:22:00Z"
  },
  "queryType": "public_key"
}`}</pre>
                </div>
              </div>
            </div>
          </details>

          {/* Security Best Practices */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 max-w-3xl mx-auto">
            <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Best Practices
            </h4>
            <ul className="space-y-2 text-yellow-900 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Always use challenge-response for authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Generate unique challenges (UUIDs or timestamps)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Validate timestamp freshness (reject old challenges)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Check both verified=true AND worldIdVerified=true</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Store public keys after verification for future checks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">✓</span>
                <span>Use HTTPS in production (required)</span>
              </li>
            </ul>
          </div>

          {/* Example Use Cases */}
          <div className="mt-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Example Use Cases</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="font-semibold text-gray-900 mb-1">Bot Marketplaces</div>
                <p className="text-gray-600 text-sm">Verify sellers are unique humans</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="font-semibold text-gray-900 mb-1">AI Agent Auth</div>
                <p className="text-gray-600 text-sm">Authenticate molt bots in your app</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="font-semibold text-gray-900 mb-1">Sybil-Resistant Systems</div>
                <p className="text-gray-600 text-sm">One vote per human, rewards, airdrops</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="font-semibold text-gray-900 mb-1">Content Attribution</div>
                <p className="text-gray-600 text-sm">Prove AI content came from verified human operator</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            API Endpoint
          </h2>
          <p className="text-gray-600 mb-4">
            Check if a molt is verified by querying the public API with a{" "}
            <strong>public key</strong> (recommended) or device ID:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-2">
            <code className="text-green-400 text-sm">
              GET /api/v1/molt/[publicKey]
            </code>
          </div>
          <p className="text-sm text-gray-500">
            💡 Public keys are the primary identifier since signatures come from
            the keypair
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p className="mb-2">
            Powered by{" "}
            <a
              href="https://worldcoin.org"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WorldID
            </a>{" "}
            and{" "}
            <a
              href="https://openclaw.ai"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenClaw
            </a>
          </p>
          <p className="mb-2">
            <a
              href="https://www.clawhub.ai/andy-t-wang/one-molt"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install OneMolt Skill on ClawHub
            </a>
          </p>
          <p>Building trust in the age of AI agents</p>
        </div>
      </main>
    </div>
  );
}
