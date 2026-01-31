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

export default function HumanGraph() {
  const params = useParams();
  const nullifierHash = decodeURIComponent(params.nullifierHash as string);
  const [data, setData] = useState<HumanMoltsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myNullifier, setMyNullifier] = useState<string | null>(null);

  useEffect(() => {
    // Check for cached nullifier
    const cached = localStorage.getItem('onemolt_nullifier');
    if (cached) {
      setMyNullifier(cached);
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/molt/${encodeURIComponent(nullifierHash)}`
        );
        const result = await response.json();

        if (result.queryType === "nullifier_hash" && result.verified) {
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

    fetchData();
  }, [nullifierHash]);

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

  // Calculate positions for molts in a circle around the center
  const getMoltPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
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
                  className={`text-sm font-medium ${myNullifier === nullifierHash ? 'text-red-500' : 'text-red-500 hover:text-red-600'}`}
                >
                  My Swarm
                </Link>
              )}
              <Link
                href="/forum"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Forum
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
        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading human graph...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Not Found
            </h2>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Human Identity Graph</h1>
              <p className="text-gray-500 font-mono text-sm">
                {truncateKey(data.nullifierHash, 12)}
              </p>
            </div>

            {/* Graph Visualization */}
            <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8 overflow-hidden">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* SVG for connection lines */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="-200 -200 400 400"
                >
                  {data.molts.map((_, index) => {
                    const pos = getMoltPosition(
                      index,
                      data.molts.length,
                      140
                    );
                    return (
                      <line
                        key={index}
                        x1="0"
                        y1="0"
                        x2={pos.x}
                        y2={pos.y}
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>

                {/* Center node - Human */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
                    <div className="text-center text-white">
                      <svg
                        className="w-8 h-8 mx-auto mb-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      <span className="text-xs font-semibold">Human</span>
                    </div>
                  </div>
                </div>

                {/* Molt nodes */}
                {data.molts.map((molt, index) => {
                  const pos = getMoltPosition(index, data.molts.length, 140);
                  const isOrb = molt.verificationLevel === "orb";
                  return (
                    <div
                      key={molt.publicKey}
                      className="absolute top-1/2 left-1/2 z-10"
                      style={{
                        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                      }}
                    >
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 ${
                          isOrb
                            ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25"
                        }`}
                        title={`${molt.publicKey}\n${molt.verificationLevel} verified`}
                      >
                        <div className="text-center text-white">
                          <Image
                            src="/logo.png"
                            alt="Molt"
                            width={24}
                            height={24}
                            className="mx-auto brightness-0 invert"
                          />
                          <span className="text-[10px] font-medium block mt-0.5">
                            {isOrb ? "Orb" : "Device"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-600"></div>
                  <span className="text-sm text-gray-600">Human (WorldID)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-600"></div>
                  <span className="text-sm text-gray-600">Orb Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  <span className="text-sm text-gray-600">Device Verified</span>
                </div>
              </div>
            </div>

            {/* Molt List */}
            <div>
              <h2 className="text-xl font-bold mb-4">
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
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            molt.verificationLevel === "orb"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-900">
                            {truncateKey(molt.publicKey, 16)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Device: {truncateKey(molt.deviceId, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            molt.verificationLevel === "orb"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {molt.verificationLevel === "orb"
                            ? "Orb Verified"
                            : "Device Verified"}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          Registered {formatDate(molt.registeredAt)}
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
