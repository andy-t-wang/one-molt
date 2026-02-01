"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

const LobsterIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <g>
      <path d="M14.847 22.402h-.064c-2.117-.069-4.919-1.006-6.246-5.077a.793.793 0 0 1 .503-.999a.783.783 0 0 1 .992.499l.003.011c.312.959 1.263 3.876 4.8 3.991a.788.788 0 0 1 .012 1.575zm-5.348 5.637a.787.787 0 0 1 .698-.342c3.034.181 4.578-1.938 5.086-2.634a.787.787 0 0 1 1.1-.173c.352.256.414.747.173 1.1c-1.698 2.33-3.869 3.434-6.453 3.28a.789.789 0 0 1-.604-1.231z" />
      <path d="M14.362 23.967a13.22 13.22 0 0 0 1.022-.2l.179-.04a.787.787 0 1 0-.334-1.54l-.193.043c-1.087.245-3.635.824-6.463-1.149a.788.788 0 0 0-.901 1.291c2.665 1.86 5.165 1.826 6.69 1.595z" />
      <path d="M15.403 25.298a22.727 22.727 0 0 0 1.053-.624a.788.788 0 1 0-.825-1.343l-.168.105c-.944.591-3.156 1.981-6.479 1.057a.788.788 0 0 0-.422 1.518c3.131.87 5.479.009 6.841-.713z" />
    </g>
    <g>
      <path d="M21.833 22.402h.064c2.117-.069 4.919-1.006 6.246-5.077a.793.793 0 0 0-.503-.999a.783.783 0 0 0-.992.499l-.003.011c-.312.959-1.263 3.876-4.8 3.991a.788.788 0 0 0-.012 1.575zm5.348 5.637a.787.787 0 0 0-.698-.342c-3.034.181-4.578-1.938-5.086-2.634a.787.787 0 0 0-1.1-.173c-.352.256-.414.747-.173 1.1c1.698 2.33 3.869 3.434 6.453 3.28a.789.789 0 0 0 .604-1.231z" />
      <path d="M22.318 23.967a13.22 13.22 0 0 1-1.022-.2l-.179-.04a.787.787 0 1 1 .334-1.54l.193.043c1.087.245 3.635.824 6.463-1.149a.788.788 0 0 1 .901 1.291c-2.664 1.86-5.165 1.826-6.69 1.595z" />
      <path d="M21.277 25.298a22.727 22.727 0 0 1-1.053-.624a.788.788 0 1 1 .825-1.343l.168.105c.944.591 3.156 1.981 6.479 1.057a.788.788 0 0 1 .422 1.518c-3.131.87-5.479.009-6.841-.713z" />
    </g>
    <path d="M8.983 6.922c.752-.779 2.316-2.461 1.59-3.954c.949.077 6.757 6.159-.06 9.073c-1.072-.137-1.53-5.119-1.53-5.119zm8.772 23.394c-.726.329-4.25 2.171-4.354 5.46c.069.789 2.73-1.25 5.01-1.25v-3.454l-.656-.756z" />
    <path d="M19.035 30.316c.726.329 4.25 2.171 4.354 5.46c-.069.789-2.73-1.25-5.01-1.25v-3.454l.656-.756zm-11.4-18.303c.133 1.429 2.975 2.889 5.023 3.227c.262-.57-1.354-2.237-2.227-3.246c-.488-.564-.701-1.904-2.185-1.321s-.611 1.34-.611 1.34z" />
    <path d="M11.742 13.793c-.655 0-.83 1.754 2.489 2.544s1.56-.878 1.048-1.667c-.656-1.009-3.537-.877-3.537-.877z" />
    <path
      opacity="0.7"
      d="M15.465 25.382c-.187.987-.075 6.217 2.961 6.612v-7.006l-2.961.394z"
    />
    <path d="M27.629 6.922c-.752-.779-2.316-2.461-1.59-3.954c-.949.077-6.757 6.159.06 9.073c1.072-.137 1.53-5.119 1.53-5.119z" />
    <path d="M28.976 12.013c-.133 1.429-2.975 2.889-5.023 3.227c-.262-.57 1.354-2.237 2.227-3.246c.488-.564.701-1.904 2.185-1.321s.611 1.34.611 1.34z" />
    <path d="M24.87 13.793c.655 0 .83 1.754-2.489 2.544s-1.56-.878-1.048-1.667c.655-1.009 3.537-.877 3.537-.877z" />
    <path
      opacity="0.8"
      d="M28.391.042c2.633.67 4.675 5.092 4.174 7.847c-.782 4.302-2.992 5.787-5.428 6.164c-.748-.058-3.293-3.474-.576-6.272s2.505-5.856 1.83-7.739z"
    />
    <path d="M17.541 12.5a.5.5 0 0 1-.498-.461c-.498-6.35-2.635-10.064-6.018-10.459a.499.499 0 1 1 .117-.993c2.264.264 6.17 2.093 6.898 11.374a.501.501 0 0 1-.459.538l-.04.001zm1.418 0l-.04-.001a.5.5 0 0 1-.459-.538C19.188 2.68 23.095.851 25.359.587a.499.499 0 1 1 .116.993c-3.383.395-5.52 4.109-6.018 10.459a.5.5 0 0 1-.498.461z" />
    <path
      opacity="0.6"
      d="M18.381 23.04c0 1 .019 3.326.019 4.876c-.576 0-1.491-.016-2.438-.3c-1.497-.45-1.113-3.901-.614-4.701l3.033.125z"
    />
    <path d="M18.335 19.239c0 1.113.022 3.702.022 5.428c-.655 0-1.696-.017-2.773-.334c-1.703-.501-1.266-4.342-.699-5.233l3.45.139z" />
    <path
      opacity="0.8"
      d="M18.335 11.731c0 2.169.279 8.822.279 9.497c-1.397 0-5.301.337-5.082-3.134c.218-3.47 2.358-6.363 4.803-6.363z"
    />
    <path
      opacity="0.7"
      d="M21.152 25.382c.187.987.075 6.217-2.961 6.612v-7.006l2.961.394z"
    />
    <path
      opacity="0.6"
      d="M18.235 23.04c0 1-.152 3.326-.152 4.876c.576 0 1.624-.016 2.57-.3c1.497-.45 1.113-3.901.614-4.701l-3.032.125z"
    />
    <path d="M18.282 19.239c0 1.113-.165 3.702-.165 5.428c.655 0 1.84-.017 2.916-.334c1.703-.501 1.266-4.342.699-5.233l-3.45.139z" />
    <path
      opacity="0.8"
      d="M18.282 11.731c0 2.169-.21 8.822-.21 9.497c1.397 0 5.231.337 5.013-3.134s-2.358-6.363-4.803-6.363zM8.22.042c-2.633.67-4.675 5.092-4.174 7.847c.782 4.302 2.992 5.787 5.428 6.164c.748-.058 3.293-3.474.576-6.272S7.546 1.925 8.22.042z"
    />
  </svg>
);

interface MoltStatus {
  verified: boolean;
  deviceId?: string;
  publicKey?: string;
  moltSwarm?: string;
  worldId?: {
    verified: boolean;
    verificationLevel?: string;
    nullifierHash?: string;
    registeredAt?: string;
  };
}

interface SwarmMolt {
  deviceId: string;
  publicKey: string;
  verificationLevel: string;
  registeredAt: string;
}

interface SwarmData {
  verified: boolean;
  nullifierHash: string;
  molts: SwarmMolt[];
}

interface PageProps {
  params: Promise<{ publicKey: string }>;
}

export default function VerifyPage({ params }: PageProps) {
  const { publicKey } = use(params);
  const [status, setStatus] = useState<
    "loading" | "verified" | "not-verified" | "error"
  >("loading");
  const [moltData, setMoltData] = useState<MoltStatus | null>(null);
  const [swarmData, setSwarmData] = useState<SwarmData | null>(null);

  useEffect(() => {
    async function checkVerification() {
      try {
        const response = await fetch(
          `/api/v1/molt/${encodeURIComponent(publicKey)}`,
        );
        const data: MoltStatus = await response.json();

        if (response.ok) {
          setMoltData(data);
          if (data.verified && data.worldId?.verified) {
            setStatus("verified");

            // Fetch swarm data
            if (data.worldId.nullifierHash) {
              const swarmResponse = await fetch(
                `/api/v1/molt/${encodeURIComponent(data.worldId.nullifierHash)}`,
              );
              const swarm = await swarmResponse.json();
              if (swarm.queryType === "human_id") {
                setSwarmData(swarm);
              }
            }
          } else {
            setStatus("not-verified");
          }
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Failed to check verification:", error);
        setStatus("error");
      }
    }

    checkVerification();
  }, [publicKey]);

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      "Verifying my molt bot has a human behind it! 🤖👤 #OneMolt @worldcoin",
    );
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">Failed to check verification status</p>
        </div>
      </div>
    );
  }

  if (status === "verified" && moltData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Verified Molt
              </h1>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Operated by a verified unique human
            </p>

            {/* Compact Details */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Verified
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {moltData.worldId?.registeredAt &&
                  new Date(moltData.worldId.registeredAt).toLocaleDateString()}
              </span>
              {swarmData && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {swarmData.molts.length}{" "}
                  {swarmData.molts.length === 1 ? "molt" : "molts"} in swarm
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-2 mb-4">
              <p className="text-[10px] font-mono text-gray-500 break-all">
                {moltData.publicKey}
              </p>
            </div>
          </div>

          {/* Swarm Graph */}
          {swarmData && swarmData.molts.length > 0 && (
            <div
              className="rounded-2xl shadow-xl p-6 mb-4 overflow-hidden"
              style={{
                backgroundColor: "#0d0d0d",
                backgroundImage:
                  "radial-gradient(circle, #333 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="flex flex-col items-center py-4">
                {/* Human node */}
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
                    border: "2px dashed #ef4444",
                    boxShadow: "0 0 30px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <svg
                    className="w-10 h-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d0d0d]"></div>
                </div>

                {/* Connection lines */}
                <svg
                  className="w-full h-16"
                  viewBox="0 0 300 60"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {swarmData.molts.map((molt, index) => {
                    const totalMolts = swarmData.molts.length;
                    const spacing =
                      totalMolts === 1 ? 150 : 240 / (totalMolts - 1);
                    const x = totalMolts === 1 ? 150 : 30 + index * spacing;
                    const isCurrentMolt = molt.publicKey === moltData.publicKey;
                    return (
                      <path
                        key={index}
                        d={`M150,0 Q150,30 ${x},60`}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="2 6"
                        strokeLinecap="round"
                        strokeOpacity={isCurrentMolt ? "0.8" : "0.4"}
                      />
                    );
                  })}
                </svg>

                {/* Molts row */}
                <div className="flex flex-wrap justify-center gap-6">
                  {swarmData.molts.map((molt) => {
                    const isCurrentMolt = molt.publicKey === moltData.publicKey;
                    return (
                      <div
                        key={molt.publicKey}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${
                            isCurrentMolt
                              ? "ring-2 ring-red-500 ring-offset-2 ring-offset-[#0d0d0d]"
                              : ""
                          }`}
                          style={{
                            background:
                              "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
                            border: "2px dashed #22c55e",
                            boxShadow: "0 0 20px rgba(34, 197, 94, 0.15)",
                          }}
                          title={molt.publicKey}
                        >
                          <LobsterIcon className="w-7 h-7 text-white opacity-80" />
                        </div>
                        {isCurrentMolt && (
                          <span className="text-[10px] text-red-400 mt-2">
                            This molt
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
            <div className="flex gap-3">
              <button
                onClick={shareOnTwitter}
                className="flex-1 bg-[#1DA1F2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Share
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                ← Back
              </Link>
            </div>
          </div>

          {/* Info */}
          <p className="text-center text-xs text-gray-500">
            Verified with{" "}
            <a
              href="https://world.org/world-id"
              className="text-red-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              World ID
            </a>{" "}
            proof-of-personhood
          </p>
        </div>
      </div>
    );
  }

  // Not verified
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="text-yellow-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
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
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Verified</h1>
        <p className="text-gray-600 mb-6">
          This molt is not registered with World ID verification
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Learn About OneMolt
        </Link>
      </div>
    </div>
  );
}
