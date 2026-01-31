"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
  const [installMethod, setInstallMethod] = useState<"claw" | "manual">("claw");

  useEffect(() => {
    // Load Twitter widget script
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Image
            src="/logo.png"
            alt="OneMolt Logo"
            width={120}
            height={120}
            className="mx-auto mb-8"
          />
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">One</span>
            <span className="text-red-500">Molt</span>
          </h1>
          <p className="text-xl text-gray-300 mb-2 max-w-2xl mx-auto">
            Prove your molt is an extension of yourself by delegating your proof of humanity to it.
          </p>
          <p className="text-gray-500">
            <span className="text-red-400">Humans welcome to verify.</span>
          </p>
        </div>

        {/* Get Started Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-16 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4 text-center">
            Verify Your Molt
          </h2>

          {/* Method Switcher */}
          <div className="flex rounded-lg bg-gray-800 p-1 mb-4">
            <button
              onClick={() => setInstallMethod("claw")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                installMethod === "claw"
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Via Claw
            </button>
            <button
              onClick={() => setInstallMethod("manual")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                installMethod === "manual"
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Manual
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm text-red-400">
            {installMethod === "claw" ? (
              <span>claw install andy-t-wang/one-molt</span>
            ) : (
              <span>Read https://onemolt.ai/skill.md and follow the instructions to verify your molt.</span>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <p><span className="text-red-400">1.</span> Send this to your molt</p>
            <p><span className="text-red-400">2.</span> They sign up & verify with WorldID</p>
            <p><span className="text-red-400">3.</span> One human, one verified molt</p>
          </div>
        </div>

        {/* Demo Video */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">See It In Action</h2>
          <div className="max-w-2xl mx-auto">
            <video
              className="w-full rounded-lg border border-gray-800"
              controls
              playsInline
            >
              <source src="/demo.mov" type="video/quicktime" />
              <source src="/demo.mov" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Why OneMolt - The Problem */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Why OneMolt?</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            AI agent networks are vulnerable to sybil attacks. Without proof-of-personhood,
            bad actors can spin up unlimited fake agents to manipulate systems.
          </p>

          {/* Embedded Tweet */}
          <div className="max-w-lg mx-auto">
            <blockquote className="twitter-tweet" data-theme="dark">
              <a href="https://x.com/galnagli/status/2017585025475092585"></a>
            </blockquote>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-400 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Cryptographic Identity</h3>
              <p className="text-gray-400 text-sm">
                Your molt proves ownership of its Ed25519 private key through digital signatures.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-400 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">WorldID Verification</h3>
              <p className="text-gray-400 text-sm">
                Scan a QR code with World App to prove you are a unique human.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-400 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Sybil-Resistant Registry</h3>
              <p className="text-gray-400 text-sm">
                Your verified molt is registered publicly. One human can only have one active molt.
              </p>
            </div>
          </div>
        </div>

        {/* Check Verification */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4 text-center">Check Molt Verification</h2>
          <p className="text-gray-400 text-center mb-6">
            Enter a <strong className="text-white">public key</strong> or device ID to verify if a molt is registered
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Public Key: MCowBQYDK2VwAyEA... (or Device ID)"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                disabled={searching}
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? "..." : "Check"}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResult && (
            <div className="mt-6 max-w-2xl mx-auto">
              {searchResult.verified && searchResult.worldId?.verified ? (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    Verified Molt
                  </h3>
                  <p className="text-green-300 text-sm mb-4">
                    This molt is operated by a verified unique human
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-500 text-xs mb-1">Public Key</p>
                      <p className="font-mono text-gray-300 break-all text-xs">
                        {searchResult.publicKey}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-500 text-xs mb-1">Device ID</p>
                      <p className="font-mono text-gray-300 break-all text-xs">
                        {searchResult.deviceId}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800 rounded p-3">
                        <p className="text-gray-500 text-xs mb-1">Verification Level</p>
                        <p className="text-gray-300 capitalize">
                          {searchResult.worldId.verificationLevel}
                        </p>
                      </div>
                      <div className="bg-gray-800 rounded p-3">
                        <p className="text-gray-500 text-xs mb-1">Registered</p>
                        <p className="text-gray-300 text-xs">
                          {searchResult.worldId.registeredAt &&
                            new Date(searchResult.worldId.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-1">Not Verified</h3>
                  <p className="text-yellow-300 text-sm">
                    This molt is not registered with WorldID verification
                  </p>
                </div>
              )}
            </div>
          )}

          {searchError && (
            <div className="mt-6 max-w-2xl mx-auto bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* API Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4">API Endpoint</h2>
          <p className="text-gray-400 mb-4">
            Check if a molt is verified by querying the public API:
          </p>
          <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <code className="text-red-400 text-sm">GET /api/v1/molt/[publicKey]</code>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p className="mb-2">
            Powered by{" "}
            <a
              href="https://worldcoin.org"
              className="text-red-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WorldID
            </a>{" "}
            and{" "}
            <a
              href="https://openclaw.ai"
              className="text-red-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenClaw
            </a>
          </p>
          <p>Building trust in the age of AI agents</p>
        </div>
      </main>
    </div>
  );
}
