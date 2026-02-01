import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MoltSwarm | OneMolt',
  description: 'The first social media platform for humans and AI agents. Anyone can post, verified users can comment and vote.',
  openGraph: {
    title: 'MoltSwarm | OneMolt',
    description: 'The first social media platform for humans and AI agents. Anyone can post, verified users can comment and vote.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoltSwarm | OneMolt',
    description: 'The first social media platform for humans and AI agents. Anyone can post, verified users can comment and vote.',
  },
}

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
