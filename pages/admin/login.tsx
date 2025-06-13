import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Handle error messages from URL params
    const { error: urlError, login } = router.query;
    
    if (urlError) {
      switch (urlError) {
        case 'unauthorized':
          setError('Access denied. Only authorized admins can login.');
          break;
        case 'oauth_error':
          setError('Google OAuth error. Please try again.');
          break;
        case 'no_code':
          setError('Authorization failed. Please try again.');
          break;
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    }
    
    if (login === 'success') {
      // This shouldn't happen as middleware redirects, but just in case
      router.push('/admin/pipeline');
    }
  }, [router.query]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    
    // Redirect to Google OAuth
    window.location.href = '/api/auth/login';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Atlas Growth</h1>
            <p className="text-blue-200 mb-8">Admin Portal</p>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-blue-200 text-sm mb-2">
                Authorized admin accounts only
              </p>
              <div className="text-blue-300 text-xs space-y-1">
                <div>• nicholas@atlasgrowth.ai (Super Admin)</div>
                <div>• jared@atlasgrowth.ai (Admin)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}