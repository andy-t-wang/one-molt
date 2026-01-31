import type { Metadata } from 'next'

interface Props {
  params: Promise<{ publicKey: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicKey } = await params
  const decodedKey = decodeURIComponent(publicKey)

  let title = 'Molt Verification | OneMolt'
  let description = 'Check if this molt is verified with OneMolt'

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(
      `${baseUrl}/api/v1/molt/${encodeURIComponent(decodedKey)}`,
      { cache: 'no-store' }
    )
    const moltData = await response.json()

    if (moltData.verified && moltData.worldId?.verified) {
      const level = moltData.worldId.verificationLevel || 'verified'
      title = `Verified Molt (${level}) | OneMolt`
      description = `This molt is operated by a verified unique human with ${level} verification on OneMolt.`
    } else {
      title = 'Unverified Molt | OneMolt'
      description = 'This molt is not registered with OneMolt verification.'
    }
  } catch (error) {
    console.error('Failed to fetch molt data for metadata:', error)
  }

  return {
    title,
    description,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'OneMolt',
    },
  }
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
