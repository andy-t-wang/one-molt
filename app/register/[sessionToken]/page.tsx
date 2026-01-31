'use client'

// Registration page with WorldID widget integration
// Displays device info and handles WorldID verification flow

import { use, useEffect, useState } from 'react'
import { IDKitWidget, ISuccessResult, VerificationLevel } from '@worldcoin/idkit'
import type { RegistrationStatusResponse, WorldIDSubmitResponse } from '@/lib/types'

interface PageProps {
  params: Promise<{ sessionToken: string }>
}

type RegistrationStatus = 'loading' | 'pending' | 'verifying' | 'completed' | 'expired' | 'failed' | 'error' | 'duplicate'

export default function RegisterPage({ params }: PageProps) {
  const { sessionToken } = use(params)
  const [status, setStatus] = useState<RegistrationStatus>('loading')
  const [session, setSession] = useState<RegistrationStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [registration, setRegistration] = useState<WorldIDSubmitResponse['registration'] | null>(null)
  const [existingDevice, setExistingDevice] = useState<{ deviceId: string; registeredAt: string } | null>(null)
  const [pendingProof, setPendingProof] = useState<ISuccessResult | null>(null)

  // Load session data
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/v1/register/${sessionToken}/status`)

        if (!response.ok) {
          setStatus('error')
          setError('Failed to load registration session')
          return
        }

        const data: RegistrationStatusResponse = await response.json()
        setSession(data)

        if (data.status === 'completed') {
          setStatus('completed')
          setRegistration(data.registration || null)
        } else if (data.status === 'expired') {
          setStatus('expired')
        } else if (data.status === 'failed') {
          setStatus('failed')
        } else {
          setStatus('pending')
        }
      } catch (err) {
        console.error('Failed to load session:', err)
        setStatus('error')
        setError('Failed to load registration session')
      }
    }

    loadSession()
  }, [sessionToken])

  // Handle WorldID verification success
  const handleVerify = async (result: ISuccessResult, replaceExisting = false) => {
    setStatus('verifying')
    setError(null)

    try {
      const response = await fetch(`/api/v1/register/${sessionToken}/worldid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      })

      const data: WorldIDSubmitResponse = await response.json()

      // Check for duplicate detection
      if (data.duplicateDetected && data.existingDevice) {
        setStatus('duplicate')
        setExistingDevice(data.existingDevice)
        setPendingProof(result)
        setError(data.error || 'You already have a molt registered')
        return
      }

      if (!response.ok || !data.success) {
        setStatus('failed')
        setError(data.error || 'WorldID verification failed')
        return
      }

      setStatus('completed')
      setRegistration(data.registration || null)
    } catch (err) {
      console.error('WorldID verification error:', err)
      setStatus('failed')
      setError('Failed to submit WorldID verification')
    }
  }

  // Handle replacement confirmation
  const handleReplace = async () => {
    if (!pendingProof) return
    await handleVerify(pendingProof, true)
  }

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration session...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Error</h1>
          <p className="text-gray-600 text-center">{error || 'An error occurred'}</p>
        </div>
      </div>
    )
  }

  // Render expired state
  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Session Expired</h1>
          <p className="text-gray-600 text-center mb-4">This registration session has expired. Please start a new registration from your CLI.</p>
          <p className="text-sm text-gray-500 text-center">Sessions expire after 15 minutes.</p>
        </div>
      </div>
    )
  }

  // Render completed state
  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-green-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Registration Complete!</h1>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500 mb-1">Device ID</p>
              <p className="text-xs font-mono text-gray-900 break-all">{session?.deviceId}</p>
            </div>

            {registration && (
              <>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-500 mb-1">Verification Level</p>
                  <p className="text-sm text-gray-900 capitalize">{registration.verificationLevel}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-500 mb-1">Registered At</p>
                  <p className="text-sm text-gray-900">{new Date(registration.registeredAt).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>

          <p className="text-sm text-gray-600 text-center">You can close this window and return to your CLI.</p>
        </div>
      </div>
    )
  }

  // Render failed state with easy retry
  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verification Failed</h1>
          <p className="text-gray-600 text-center mb-4">{error || 'WorldID verification failed'}</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                setStatus('pending')
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
    )
  }

  // Render duplicate detection state
  if (status === 'duplicate' && existingDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Molt Already Registered</h1>
          <p className="text-gray-600 text-center mb-4">
            You already have a molt registered to your WorldID.
          </p>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Existing Molt</p>
            <p className="text-xs font-mono text-gray-900 break-all mb-2">{existingDevice.deviceId}</p>
            <p className="text-xs text-gray-500">
              Registered: {new Date(existingDevice.registeredAt).toLocaleString()}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">⚠️ One Molt Per Human</p>
            <p className="text-xs text-blue-700">
              Replacing your existing molt will deactivate it. You can only have one active molt at a time.
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
                setStatus('pending')
                setError(null)
                setExistingDevice(null)
                setPendingProof(null)
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
    )
  }

  // Render pending state with WorldID widget
  const appId = process.env.NEXT_PUBLIC_WORLDID_APP_ID || ''
  const action = process.env.NEXT_PUBLIC_WORLDID_ACTION || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Complete Registration</h1>

        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">Step 1: Signature Verified ✓</p>
            <p className="text-xs text-blue-700">Your device ownership has been verified</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-900 mb-2">Step 2: WorldID Verification</p>
            <p className="text-xs text-gray-600 mb-3">Prove you are a unique human using World ID</p>

            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Device ID</p>
              <p className="text-xs font-mono text-gray-900 break-all">{session?.deviceId}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <IDKitWidget
            app_id={appId as `app_${string}`}
            action={action}
            signal={session?.deviceId || ''}
            verification_level={VerificationLevel.Orb}
            onSuccess={handleVerify}
            onError={(error) => {
              console.error('WorldID widget error:', error)
              setError('WorldID verification failed')
              setStatus('failed')
            }}
          >
            {({ open }) => (
              <button
                onClick={open}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" fill="white" />
                </svg>
                Verify with World ID
              </button>
            )}
          </IDKitWidget>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Expires: {session && new Date(session.expiresAt).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            Having trouble? You can retry verification multiple times
          </p>
        </div>
      </div>
    </div>
  )
}
