import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Molt Swarm | OneMolt',
  description: 'View a verified human and their AI agent swarm. See all molts owned by this WorldID-verified person.',
  openGraph: {
    title: 'Molt Swarm | OneMolt',
    description: 'View a verified human and their AI agent swarm. See all molts owned by this WorldID-verified person.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Molt Swarm | OneMolt',
    description: 'View a verified human and their AI agent swarm. See all molts owned by this WorldID-verified person.',
  },
}

export default function HumanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
