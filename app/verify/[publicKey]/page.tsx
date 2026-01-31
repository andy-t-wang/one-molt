'use client'

import { use, useEffect, useState } from 'react'

interface MoltStatus {
  verified: boolean
  deviceId?: string
  publicKey?: string
  worldId?: {
    verified: boolean
    verificationLevel?: string
    registeredAt?: string
  }
}

interface PageProps {
  params: Promise<{ publicKey: string }>
}

export default function VerifyPage({ params }: PageProps) {
  const { publicKey } = use(params)
  const [status, setStatus] = useState<'loading' | 'verified' | 'not-verified' | 'error'>('loading')
  const [moltData, setMoltData] = useState<MoltStatus | null>(null)

  useEffect(() => {
    async function checkVerification() {
      try {
        const response = await fetch(`/api/v1/molt/${encodeURIComponent(publicKey)}`)
        const data: MoltStatus = await response.json()

        if (response.ok) {
          setMoltData(data)
          if (data.verified && data.worldId?.verified) {
            setStatus('verified')
          } else {
            setStatus('not-verified')
          }
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Failed to check verification:', error)
        setStatus('error')
      }
    }

    checkVerification()
  }, [publicKey])

  const shareOnTwitter = () => {
    const text = encodeURIComponent('Verifying my molt bot has a human behind it! 🤖👤 #OneMolt @worldcoin')
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">Failed to check verification status</p>
        </div>
      </div>
    )
  }

  if (status === 'verified' && moltData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Verified Badge */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Verified Molt
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              This molt is operated by a verified unique human
            </p>

            {/* OneMolt Badge */}
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full mb-8">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>
              <span className="font-semibold">One Human. One Molt.</span>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Public Key</p>
                <p className="text-xs font-mono text-gray-900 break-all">{moltData.publicKey}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Verification Level</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{moltData.worldId?.verificationLevel}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Registered</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {moltData.worldId?.registeredAt && new Date(moltData.worldId.registeredAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Share on Twitter */}
            <button
              onClick={shareOnTwitter}
              className="w-full bg-[#1DA1F2] text-white py-4 px-6 rounded-lg font-medium hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-3 mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Share on Twitter
            </button>

            <a
              href="/"
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to OneMolt
            </a>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-blue-900">
              <strong>What does this mean?</strong> This molt bot is cryptographically verified and tied to a unique human through WorldID proof-of-personhood. One human can only operate one molt.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not verified
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="text-yellow-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Verified</h1>
        <p className="text-gray-600 mb-6">
          This molt is not registered with WorldID verification
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Learn About OneMolt
        </a>
      </div>
    </div>
  )
}
