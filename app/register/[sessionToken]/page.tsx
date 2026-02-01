"use client";

// Registration page with WorldID widget integration
// Displays device info and handles WorldID verification flow

import { use, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  IDKitWidget,
  ISuccessResult,
  VerificationLevel,
} from "@andy_tfh/idkit";
import type {
  RegistrationStatusResponse,
  WorldIDSubmitResponse,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ sessionToken: string }>;
}

type RegistrationStatus =
  | "loading"
  | "pending"
  | "verifying"
  | "completed"
  | "expired"
  | "failed"
  | "error"
  | "duplicate";

// Track localStorage changes for nullifier
let nullifierListeners: Array<() => void> = [];
function subscribeToNullifier(callback: () => void) {
  nullifierListeners.push(callback);
  return () => {
    nullifierListeners = nullifierListeners.filter((l) => l !== callback);
  };
}
function getNullifierSnapshot() {
  return localStorage.getItem("onemolt_nullifier");
}
function getNullifierServerSnapshot() {
  return null;
}
function notifyNullifierChange() {
  nullifierListeners.forEach((l) => l());
}

export default function RegisterPage({ params }: PageProps) {
  const { sessionToken } = use(params);
  const [status, setStatus] = useState<RegistrationStatus>("loading");
  const [session, setSession] = useState<RegistrationStatusResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<
    WorldIDSubmitResponse["registration"] | null
  >(null);
  const [existingDevice, setExistingDevice] = useState<{
    deviceId: string;
    registeredAt: string;
  } | null>(null);
  const [pendingProof, setPendingProof] = useState<ISuccessResult | null>(null);

  const cachedNullifier = useSyncExternalStore(
    subscribeToNullifier,
    getNullifierSnapshot,
    getNullifierServerSnapshot,
  );

  // Load session data
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/v1/register/${sessionToken}/status`);

        if (!response.ok) {
          setStatus("error");
          setError("Failed to load registration session");
          return;
        }

        const data: RegistrationStatusResponse = await response.json();
        setSession(data);

        if (data.status === "completed") {
          setStatus("completed");
          setRegistration(data.registration || null);
        } else if (data.status === "expired") {
          setStatus("expired");
        } else if (data.status === "failed") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        setStatus("error");
        setError("Failed to load registration session");
      }
    }

    loadSession();
  }, [sessionToken]);

  // Handle WorldID verification success
  const handleVerify = async (
    result: ISuccessResult,
    replaceExisting = false,
  ) => {
    setStatus("verifying");
    setError(null);

    try {
      const response = await fetch(`/api/v1/register/${sessionToken}/worldid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof: {
            proof: result.proof,
            merkle_root: result.merkle_root,
            nullifier_hash: result.nullifier_hash,
            verification_level: result.verification_level,
          },
          signal: session?.deviceId,
          replaceExisting,
        }),
      });

      const data: WorldIDSubmitResponse = await response.json();

      // Check for duplicate detection
      if (data.duplicateDetected && data.existingDevice) {
        setStatus("duplicate");
        setExistingDevice(data.existingDevice);
        setPendingProof(result);
        setError(data.error || "You already have a molt registered");
        return;
      }

      if (!response.ok || !data.success) {
        setStatus("failed");
        setError(data.error || "WorldID verification failed");
        return;
      }

      // Cache the nullifier hash for "My Swarm" feature
      if (result.nullifier_hash) {
        localStorage.setItem("onemolt_nullifier", result.nullifier_hash);
        notifyNullifierChange();
      }

      setStatus("completed");
      setRegistration(data.registration || null);
    } catch (err) {
      console.error("World ID verification error:", err);
      setStatus("failed");
      setError("Failed to submit WorldID verification");
    }
  };

  // Handle replacement confirmation
  const handleReplace = async () => {
    if (!pendingProof) return;
    await handleVerify(pendingProof, true);
  };

  // Render loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration session...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Error
          </h1>
          <p className="text-gray-600 text-center">
            {error || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Render verifying state
  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="relative mx-auto mb-6 w-20 h-20">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
              {/* Inner logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="OneMolt"
                  width={40}
                  height={40}
                  className="opacity-80"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying...
            </h1>
            <p className="text-gray-600 mb-4">
              Please wait while we verify your WorldID proof
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Don&apos;t close this page</span>
                <br />
                <span className="text-yellow-700">
                  This usually takes a few seconds
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render expired state
  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Session Expired
          </h1>
          <p className="text-gray-600 text-center mb-4">
            This registration session has expired. Please start a new
            registration from your CLI.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Sessions expire after 15 minutes.
          </p>
        </div>
      </div>
    );
  }

  // Render completed state
  if (status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-center mb-6">
            <Image
              src="/logo.png"
              alt="OneMolt"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verified Human Selfie
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re All Set!
            </h1>
            <p className="text-sm text-gray-500">
              Your molt is now verified as being operated by a human
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs font-medium text-gray-500 mb-1">Molt ID</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {session?.deviceId}
              </p>
            </div>

            {registration && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 p-3 rounded-md">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Verification
                    </p>
                    <p className="text-sm text-gray-900 capitalize">
                      {registration.verificationLevel === "face"
                        ? "Selfie"
                        : "Device"}
                    </p>
                  </div>

                  <div className="flex-1 bg-gray-50 p-3 rounded-md">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Registered
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Share on Twitter */}
          {registration && registration.publicKey && (
            <div className="mb-6">
              <button
                onClick={() => {
                  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(registration.publicKey)}`;
                  const text = encodeURIComponent(
                    "My AI agent is now verified as human-operated with OneMolt + World ID! 🤖✓ #OneMolt",
                  );
                  const url = encodeURIComponent(verifyUrl);
                  window.open(
                    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                    "_blank",
                  );
                }}
                className="w-full bg-[#1DA1F2] text-white py-3 px-4 rounded-md hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Share on Twitter
              </button>
            </div>
          )}

          {/* View My Swarm */}
          {cachedNullifier && (
            <a
              href={`/human/${encodeURIComponent(cachedNullifier)}`}
              className="block w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors text-center font-medium mb-6"
            >
              View My Swarm
            </a>
          )}

          <p className="text-sm text-gray-500 text-center">
            You can close this window now. Your molt is ready to go!
          </p>
        </div>
      </div>
    );
  }

  // Render failed state with easy retry
  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Verification Failed
          </h1>
          <p className="text-gray-600 text-center mb-4">
            {error || "WorldID verification failed"}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setStatus("pending");
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>

            <p className="text-xs text-gray-500 text-center">
              No need to restart - just scan the QR code again
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render duplicate detection state
  if (status === "duplicate" && existingDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Molt Already Registered
          </h1>
          <p className="text-gray-600 text-center mb-4">
            You already have a molt registered to your WorldID.
          </p>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-sm font-medium text-gray-500 mb-2">
              Existing Molt
            </p>
            <p className="text-xs font-mono text-gray-900 break-all mb-2">
              {existingDevice.deviceId}
            </p>
            <p className="text-xs text-gray-500">
              Registered:{" "}
              {new Date(existingDevice.registeredAt).toLocaleString()}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">
              ⚠️ Re-verifying Your Molt
            </p>
            <p className="text-xs text-blue-700">
              Are you reassigning your molt to a new user?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReplace}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Replace with This Device
            </button>

            <button
              onClick={() => {
                setStatus("pending");
                setError(null);
                setExistingDevice(null);
                setPendingProof(null);
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>

            <p className="text-xs text-gray-500 text-center">
              Need to manage multiple devices? Contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render pending state with WorldID widget
  const appId = process.env.NEXT_PUBLIC_WORLDID_APP_ID || "";
  const action = process.env.NEXT_PUBLIC_WORLDID_ACTION || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <Image
            src="/logo.png"
            alt="OneMolt"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Claim Your Molt
          </h1>
          <p className="text-sm text-gray-500">
            Make your molt more trusted by proving there&apos;s a real human behind it
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Now prove you&apos;re human
            </p>
            <p className="text-xs text-gray-600 mb-4">
              Scan with the World App to link your unique human identity to this
              molt. This ensures one person can only have one verified molt.
            </p>

            <div className="bg-white border border-gray-200 p-3 rounded-md">
              <p className="text-xs font-medium text-gray-500 mb-1">Molt ID</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {session?.deviceId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <IDKitWidget
            app_id={appId as `app_${string}`}
            action={action}
            signal={session?.deviceId || ""}
            verification_level={"face" as VerificationLevel}
            onSuccess={handleVerify}
            onError={(error) => {
              console.error("WorldID widget error:", error);
              setError("WorldID verification failed");
              setStatus("failed");
            }}
          >
            {({ open }) => (
              <button
                onClick={open}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" fill="white" />
                </svg>
                Verify with World ID
              </button>
            )}
          </IDKitWidget>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Don&apos;t have World App?{" "}
            <a
              href="https://world.org/world-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Download it free
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Link expires{" "}
            {session && new Date(session.expiresAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
