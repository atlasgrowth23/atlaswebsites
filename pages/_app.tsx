import '../styles/tokens.css'
import type { AppProps } from 'next/app'
import { Providers } from '@/components/ui/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/next'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Providers>
        <Component {...pageProps} />
        <Analytics />
      </Providers>
    </ErrorBoundary>
  )
}

export default MyApp