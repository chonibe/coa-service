import VendorInstagramFeed from "@/components/vendor-instagram-feed"

export default function VendorInstagramPage({ params }: { params: { vendor: string } }) {
  const { vendor } = params

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{vendor} Instagram Feed</h1>
      <VendorInstagramFeed vendor={vendor} />
    </div>
  )
}
