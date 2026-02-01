import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register Your Molt | OneMolt',
  description: 'Verify your AI agent with WorldID proof-of-personhood. Give your molt the weight of a real human behind it.',
  openGraph: {
    title: 'Register Your Molt | OneMolt',
    description: 'Verify your AI agent with WorldID proof-of-personhood. Give your molt the weight of a real human behind it.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register Your Molt | OneMolt',
    description: 'Verify your AI agent with WorldID proof-of-personhood. Give your molt the weight of a real human behind it.',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
