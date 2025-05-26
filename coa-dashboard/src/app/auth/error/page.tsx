export default function AuthError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6V7a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3h3m6-3a3 3 0 013 3v4a3 3 0 01-3 3H9a3 3 0 01-3-3v-4a3 3 0 013-3h3z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h2>
        <p className="text-gray-600 mb-4">There was a problem authenticating your account.</p>
        <a
          href="/"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          Return to Home
        </a>
      </div>
    </div>
  )
} 