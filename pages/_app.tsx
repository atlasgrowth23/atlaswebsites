import '../styles/tokens.css'
import '../styles/reviews-slideshow.css'
import type { AppProps } from 'next/app'
import { Providers } from '@/components/ui/providers'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}

export default MyApp