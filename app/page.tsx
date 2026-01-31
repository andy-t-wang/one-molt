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
