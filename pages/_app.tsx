import '../styles/tokens.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Providers } from '@/components/ui/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/next'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ErrorBoundary>
        <Providers>
          <Component {...pageProps} />
          <Analytics />
        </Providers>
      </ErrorBoundary>
    </SessionProvider>
  )
}

export default MyApp