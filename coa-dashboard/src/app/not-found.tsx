export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          Go back home
        </a>
      </div>
    </div>
  )
} 