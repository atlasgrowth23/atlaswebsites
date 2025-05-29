import '../styles/tokens.css'
import '../styles/reviews-slideshow.css'
import type { AppProps } from 'next/app'
import { Providers } from '@/components/ui/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </ErrorBoundary>
  )
}

export default MyApp