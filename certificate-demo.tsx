import { CertificatePerks } from "@/components/certificate-perks"

export default function CertificateDemo() {
  // In a real implementation, these IDs would come from your authentication system
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 min-h-[80vh] relative">
        <h1 className="text-2xl font-bold mb-4">Certificate of Authenticity</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="aspect-square bg-gray-200 rounded-lg mb-4">
              <img src="/chromatic-flow.png" alt="Artwork" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Untitled #42</h2>
            <p className="text-gray-600 mb-4">By Chanchal Banga</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Edition</h3>
                <p>1 of 10</p>
              </div>

              <div>
                <h3 className="font-medium">Created</h3>
                <p>April 2023</p>
              </div>

              <div>
                <h3 className="font-medium">Medium</h3>
                <p>Digital Art, Giclée print on archival paper</p>
              </div>

              <div>
                <h3 className="font-medium">Dimensions</h3>
                <p>24 × 36 inches</p>
              </div>
            </div>
          </div>
        </div>

        {/* This is where the enhanced perks experience is integrated */}
        <CertificatePerks artistId={artistId} certificateId={certificateId} collectorId={collectorId} />
      </div>
    </div>
  )
}
