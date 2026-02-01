import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ShortUrlRedirect({ params }: PageProps) {
  const { code } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    redirect('/')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Look up the short code
  const { data } = await supabase
    .from('short_urls')
    .select('nullifier_hash')
    .eq('code', code.toLowerCase())
    .single()

  if (data?.nullifier_hash) {
    redirect(`/human/${encodeURIComponent(data.nullifier_hash)}`)
  }

  // If not found, redirect to home
  redirect('/')
}
