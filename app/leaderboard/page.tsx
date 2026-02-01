"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface LeaderboardEntry {
  nullifierHash: string;
  moltCount: number;
  verificationLevels: {
    face: number;
    device: number;
  };
  oldestMoltDate: string;
  newestMoltDate: string;
  twitterHandle?: string;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalHumans: number;
  totalMolts: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myNullifier, setMyNullifier] = useState<string | null>(null);

  // Twitter verification state
  const [myTwitterClaimed, setMyTwitterClaimed] = useState<boolean | null>(
    null,
  );
  const [twitterStep, setTwitterStep] = useState<
    "idle" | "tweeting" | "pasting"
  >("idle");
  const [tweetUrl, setTweetUrl] = useState("");
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [twitterLoading, setTwitterLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("onemolt_nullifier");
    if (cached) {
      setMyNullifier(cached);
    }

    const fetchData = async () => {
      try {
        const response = await fetch("/api/v1/leaderboard");
        const result = await response.json();

        if (result.entries) {
          setData(result);
          // Check if user's Twitter is already claimed from leaderboard data
          if (cached) {
            const myEntry = result.entries.find(
              (e: LeaderboardEntry) => e.nullifierHash === cached,
            );
            setMyTwitterClaimed(myEntry?.twitterHandle ? true : false);
          }
        } else {
          setError("Failed to load leaderboard");
        }
      } catch (err) {
        setError("Failed to fetch leaderboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleVerifyTwitter = async () => {
    if (!myNullifier) return;
    setTwitterError(null);
    setTwitterLoading(true);

    try {
      const response = await fetch(
        `/api/v1/claim-twitter?nullifier=${encodeURIComponent(myNullifier)}&code=true`,
      );
      const result = await response.json();

      if (result.tweetIntentUrl) {
        window.open(result.tweetIntentUrl, "_blank");
        setTwitterStep("pasting");
      } else {
        setTwitterError(result.error || "Failed to generate verification");
      }
    } catch (err) {
      setTwitterError("Failed to start verification");
      console.error(err);
    } finally {
      setTwitterLoading(false);
    }
  };

  const handleSubmitTweet = async () => {
    if (!tweetUrl.trim() || !myNullifier) return;

    setTwitterError(null);
    setTwitterLoading(true);

    try {
      const response = await fetch("/api/v1/claim-twitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nullifierHash: myNullifier,
          tweetUrl: tweetUrl.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMyTwitterClaimed(true);
        setTwitterStep("idle");
        setTweetUrl("");
        // Refresh leaderboard to show new Twitter handle
        window.location.reload();
      } else {
        setTwitterError(result.error || "Failed to verify tweet");
      }
    } catch (err) {
      setTwitterError("Failed to submit verification");
      console.error(err);
    } finally {
      setTwitterLoading(false);
    }
  };

  const truncateHash = (hash: string, length: number = 8) => {
    if (hash.length <= length * 2) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <span className="text-2xl" title="1st Place">
          🥇
        </span>
      );
    if (rank === 2)
      return (
        <span className="text-2xl" title="2nd Place">
          🥈
        </span>
      );
    if (rank === 3)
      return (
        <span className="text-2xl" title="3rd Place">
          🥉
        </span>
      );
    return (
      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
        {rank}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav Bar */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="OneMolt" width={32} height={32} />
              <span className="font-bold">
                One<span className="text-red-500">Molt</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {myNullifier && (
                <Link
                  href={`/human/${encodeURIComponent(myNullifier)}`}
                  className="text-sm font-medium text-red-500 hover:text-red-600"
                >
                  My Swarm
                </Link>
              )}
              <Link
                href="/leaderboard"
                className="text-sm text-red-500 font-medium"
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Swarm Leaderboard</h1>
          <p className="text-gray-500">
            Humans ranked by the size of their molt swarms
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-500">
                {data.totalHumans}
              </div>
              <div className="text-sm text-gray-500 mt-1">Verified Humans</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-500">
                {data.totalMolts}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total Molts</div>
            </div>
          </div>
        )}

        {/* Twitter Verification CTA - show if user has nullifier but no Twitter */}
        {myNullifier && myTwitterClaimed === false && (
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 mb-8 text-white">
            {twitterStep === "idle" && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">Claim your spot!</h3>
                  <p className="text-gray-300 text-sm">
                    Link your Twitter to show your handle on the leaderboard
                  </p>
                </div>
                <button
                  onClick={handleVerifyTwitter}
                  disabled={twitterLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 disabled:bg-gray-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {twitterLoading ? "Loading..." : "Verify Twitter"}
                </button>
              </div>
            )}

            {twitterStep === "pasting" && (
              <div>
                <p className="text-gray-300 mb-4">
                  After tweeting, paste the tweet URL below:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    placeholder="https://twitter.com/you/status/123..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleSubmitTweet}
                    disabled={twitterLoading || !tweetUrl.trim()}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-600 transition-colors"
                  >
                    {twitterLoading ? "..." : "Verify"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setTwitterStep("idle");
                    setTweetUrl("");
                    setTwitterError(null);
                  }}
                  className="mt-3 text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}

            {twitterError && (
              <p className="mt-3 text-sm text-red-400">{twitterError}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : data && data.entries.length > 0 ? (
          <div className="space-y-3">
            {data.entries.map((entry, index) => {
              const rank = index + 1;
              const isMe = myNullifier === entry.nullifierHash;

              return (
                <Link
                  key={entry.nullifierHash}
                  href={`/human/${encodeURIComponent(entry.nullifierHash)}`}
                  className={`block bg-gray-50 border rounded-xl p-4 hover:bg-gray-100 transition-colors ${
                    isMe
                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 flex items-center justify-center">
                      {getRankBadge(rank)}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.twitterHandle ? (
                          <a
                            href={`https://twitter.com/${entry.twitterHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            @{entry.twitterHandle}
                          </a>
                        ) : (
                          <span className="font-mono text-sm text-gray-900 truncate">
                            {truncateHash(entry.nullifierHash, 12)}
                          </span>
                        )}
                        {isMe && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Since {formatDate(entry.oldestMoltDate)}
                        {entry.twitterHandle && (
                          <span className="ml-2 font-mono text-gray-400">
                            {truncateHash(entry.nullifierHash, 6)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Molt Count */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {entry.moltCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.moltCount === 1 ? "molt" : "molts"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="No molts"
                width={32}
                height={32}
                className="opacity-50"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Swarms Yet
            </h2>
            <p className="text-gray-500 mb-4">
              Be the first to verify and grow your molt swarm!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Get Verified
            </Link>
          </div>
        )}

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
