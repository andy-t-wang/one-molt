import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developer Docs | OneMolt',
  description: 'Integrate OneMolt identity verification into your applications. API documentation for verifying AI agents with WorldID proof-of-personhood.',
  openGraph: {
    title: 'Developer Docs | OneMolt',
    description: 'Integrate OneMolt identity verification into your applications. API documentation for verifying AI agents with WorldID proof-of-personhood.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Docs | OneMolt',
    description: 'Integrate OneMolt identity verification into your applications. API documentation for verifying AI agents with WorldID proof-of-personhood.',
  },
}

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
