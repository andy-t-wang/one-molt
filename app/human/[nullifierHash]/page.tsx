"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface MoltInfo {
  deviceId: string;
  publicKey: string;
  verificationLevel: string;
  registeredAt: string;
  lastVerifiedAt?: string;
}

interface HumanMoltsResponse {
  verified: boolean;
  nullifierHash: string;
  molts: MoltInfo[];
  queryType: "nullifier_hash";
}

interface TwitterClaim {
  claimed: boolean;
  twitterHandle?: string;
  claimedAt?: string;
}

export default function HumanGraph() {
  const params = useParams();
  const nullifierHash = decodeURIComponent(params.nullifierHash as string);
  const [data, setData] = useState<HumanMoltsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myNullifier, setMyNullifier] = useState<string | null>(null);

  // Twitter verification state
  const [twitterClaim, setTwitterClaim] = useState<TwitterClaim | null>(null);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [twitterLoading, setTwitterLoading] = useState(false);

  // Short URL state
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isMySwarm = myNullifier === nullifierHash;

  useEffect(() => {
    // Check for cached nullifier
    const cached = localStorage.getItem("onemolt_nullifier");
    if (cached) {
      setMyNullifier(cached);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/molt/${encodeURIComponent(nullifierHash)}`,
        );
        const result = await response.json();

        if (result.queryType === "human_id" && result.verified) {
          setData(result);
        } else {
          setError("No molts found for this human identifier");
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTwitterClaim = async () => {
      try {
        const response = await fetch(
          `/api/v1/claim-twitter?nullifier=${encodeURIComponent(nullifierHash)}`,
        );
        const result = await response.json();
        setTwitterClaim(result);
      } catch (err) {
        console.error("Failed to fetch Twitter claim:", err);
      }
    };

    const fetchShortUrl = async () => {
      try {
        const response = await fetch(
          `/api/v1/short-url?nullifier=${encodeURIComponent(nullifierHash)}`,
        );
        const result = await response.json();
        if (result.shortUrl) {
          setShortUrl(result.shortUrl);
        }
      } catch (err) {
        console.error("Failed to fetch short URL:", err);
      }
    };

    fetchData();
    fetchTwitterClaim();
    fetchShortUrl();
  }, [nullifierHash]);

  const handleConnectTwitter = async () => {
    setTwitterError(null);
    setTwitterLoading(true);

    try {
      const response = await fetch(
        `/api/auth/twitter?nullifier=${encodeURIComponent(nullifierHash)}`,
      );
      const result = await response.json();

      if (result.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = result.authUrl;
      } else {
        setTwitterError(result.error || "Failed to start Twitter connection");
      }
    } catch (err) {
      setTwitterError("Failed to connect to Twitter");
      console.error(err);
    } finally {
      setTwitterLoading(false);
    }
  };

  const truncateKey = (key: string, length: number = 8) => {
    if (key.length <= length * 2) return key;
    return `${key.slice(0, length)}...${key.slice(-length)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate positions for molts in a row below the human
  const getMoltRowPosition = (index: number, total: number) => {
    const spacing = 120;
    const totalWidth = (total - 1) * spacing;
    const startX = -totalWidth / 2;
    return { x: startX + index * spacing, y: 160 };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav Bar */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="OneMolt" width={32} height={32} />
              <span className="font-bold text-gray-900">
                One<span className="text-red-500">Molt</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {myNullifier && (
                <Link
                  href={`/human/${encodeURIComponent(myNullifier)}`}
                  className="text-sm text-red-500 hover:text-red-400 font-medium"
                >
                  My Swarm
                </Link>
              )}
              <Link
                href="/leaderboard"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Leaderboard
              </Link>
              <Link
                href="/developers"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Developers
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading swarm...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Not Found
            </h2>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Graph Visualization - Dark theme with dotted grid */}
            <div
              className="relative rounded-2xl p-8 mb-8 overflow-hidden"
              style={{
                backgroundColor: "#0d0d0d",
                backgroundImage:
                  "radial-gradient(circle, #333 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                minHeight: "450px",
              }}
            >
              {/* Glow effects */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div
                className="relative w-full max-w-3xl mx-auto flex flex-col items-center"
                style={{ minHeight: "320px" }}
              >
                {/* Center node - Human */}
                <div className="z-10">
                  <div className="flex flex-col items-center">
                    {/* Node with dashed border */}
                    <div
                      className="relative w-28 h-28 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
                        boxShadow: "0 0 40px rgba(239, 68, 68, 0.15)",
                      }}
                    >
                      {/* Dashed border overlay */}
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          border: "2px dashed #ef4444",
                          opacity: 0.7,
                        }}
                      ></div>
                      {/* Inner content */}
                      <div className="text-center">
                        <svg
                          className="w-10 h-10 mx-auto text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </div>
                    {/* Label */}
                    <div className="mt-3 text-center">
                      {twitterClaim?.claimed && twitterClaim.twitterHandle ? (
                        <a
                          href={`https://twitter.com/${twitterClaim.twitterHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          @{twitterClaim.twitterHandle}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">{isMySwarm ? "You" : "Human"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connection lines */}
                <div className="flex justify-center py-4">
                  <svg
                    width={Math.max(200, data.molts.length * 100)}
                    height="60"
                    className="overflow-visible"
                  >
                    {data.molts.map((_, index) => {
                      const totalMolts = data.molts.length;
                      const spacing = totalMolts === 1 ? 0 : 80;
                      const totalWidth = (totalMolts - 1) * spacing;
                      const startX = totalMolts === 1 ? 100 : (Math.max(200, totalMolts * 100) - totalWidth) / 2;
                      const x = startX + index * spacing;
                      const centerX = Math.max(200, totalMolts * 100) / 2;
                      return (
                        <path
                          key={index}
                          d={`M ${centerX} 0 Q ${centerX} 30 ${x} 60`}
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="2 6"
                          strokeLinecap="round"
                          strokeOpacity="0.6"
                          fill="none"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Molt nodes */}
                <div className="flex justify-center gap-6 flex-wrap">
                  {data.molts.map((molt) => (
                    <div key={molt.publicKey} className="flex flex-col items-center">
                      <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
                          boxShadow: "0 0 30px rgba(34, 197, 94, 0.15)",
                        }}
                        title={molt.publicKey}
                      >
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            border: "2px dashed #22c55e",
                            opacity: 0.7,
                          }}
                        ></div>
                        <Image
                          src="/logo.png"
                          alt="Molt"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <span className="text-gray-400 text-sm mt-3">Molt</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Twitter Connect CTA - only show for own swarm */}
            {isMySwarm && !twitterClaim?.claimed && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium mb-1">
                      Connect your X account
                    </p>
                    <p className="text-gray-500 text-sm">
                      Show your handle on the swarm graph and leaderboard
                    </p>
                  </div>
                  <button
                    onClick={handleConnectTwitter}
                    disabled={twitterLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {twitterLoading ? "Connecting..." : "Connect with X"}
                  </button>
                </div>
                {twitterError && (
                  <p className="mt-3 text-sm text-red-500">{twitterError}</p>
                )}
              </div>
            )}

            {/* Short URL for bio */}
            {shortUrl && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-sm mb-1">
                      {isMySwarm ? "Share your swarm" : "Share this swarm"}
                    </p>
                    <p className="text-gray-600 font-mono text-sm">
                      {shortUrl.replace('https://', '').replace('http://', '')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shortUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Molt List */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Connected Molts{" "}
                <span className="text-gray-400 font-normal">
                  ({data.molts.length})
                </span>
              </h2>
              <div className="space-y-3">
                {data.molts.map((molt, index) => (
                  <div
                    key={molt.publicKey}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-green-500/50 text-green-600"
                          style={{
                            background: "rgba(34, 197, 94, 0.1)",
                          }}
                        >
                          <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-700">
                            {truncateKey(molt.publicKey, 16)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Verified
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(molt.registeredAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-12 mt-12 border-t border-gray-200">
          <p className="mb-2">
            Powered by{" "}
            <a
              href="https://world.org/world-id"
              className="text-red-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WorldID
            </a>{" "}
            and{" "}
            <a
              href="https://openclaw.ai"
              className="text-red-500 hover:underline"
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
