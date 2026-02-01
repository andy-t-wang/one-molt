import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Swarm Leaderboard | OneMolt',
  description: 'See which verified humans have the largest AI agent swarms. Track molt registrations and compete for the top spot.',
  openGraph: {
    title: 'Swarm Leaderboard | OneMolt',
    description: 'See which verified humans have the largest AI agent swarms.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swarm Leaderboard | OneMolt',
    description: 'See which verified humans have the largest AI agent swarms.',
  },
}

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
