import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface CertificatePageProps {
  params: {
    lineItemId: string
  }
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { lineItemId } = params

  if (!lineItemId) {
    notFound()
  }

  // Fetch certificate data from Supabase
  const { data: certificateData, error } = await supabase
    .from("order_line_items")
    .select(`
      *,
      order:orders (
        name,
        customer:customers (
          first_name,
          last_name
        )
      ),
      product:products (
        title,
        vendor:product_vendors (
          name
        )
      )
    `)
    .eq("line_item_id", lineItemId)
    .single()

  if (error || !certificateData) {
    notFound()
  }

  // Extract the data
  const {
    order,
    product,
    edition_number,
    edition_total,
    nfc_tag_id,
  } = certificateData

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Certificate of Authenticity
              </h1>
              <p className="text-gray-600">
                This certifies the authenticity of your limited edition artwork
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Artwork Details
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Title
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.title}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Artist
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.vendor.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Edition
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      #{edition_number} of {edition_total}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Ownership Details
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Owner
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.customer.first_name} {order.customer.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Order Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Verification
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {nfc_tag_id ? "NFC Enabled" : "Standard Edition"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                This certificate verifies the authenticity of your artwork.
                {nfc_tag_id && " The artwork includes an NFC tag for additional verification."}
              </p>
              <p className="mt-2">
                Certificate ID: {lineItemId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 