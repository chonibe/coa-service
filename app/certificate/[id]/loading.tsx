export default function CertificateLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-gray-200 rounded-full mb-4 animate-pulse h-12 w-12"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-64 mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mx-auto"></div>
        </div>

        <div className="mb-8 overflow-hidden border-none shadow-lg rounded-lg">
          <div className="bg-white p-8">
            <div className="mb-8 aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="mb-8 text-center">
              <div className="h-7 bg-gray-200 rounded animate-pulse mb-2 w-48 mx-auto"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-1 w-32"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
