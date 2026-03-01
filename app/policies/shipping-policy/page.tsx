import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping policy for The Street Collector. Production time, delivery times, tracking, and international shipping.',
}

export default function ShippingPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Shipping Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          At Street Collector, we take care with every order. This policy outlines our production, shipping, and delivery practices.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Production Time</h2>
        <p className="text-neutral-600">
          Please allow up to 7 business days for production. Orders are printed and assembled before dispatch. We do not mass-produce inventory—every piece is prepared with care.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Delivery Time</h2>
        <p className="text-neutral-600">
          Once shipped, delivery takes approximately 9–15 business days. Customs processing times are not included. During high season, delivery may take slightly longer. All orders ship from our Shenzhen warehouse in China.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Tracking</h2>
        <p className="text-neutral-600">
          As soon as your order is packed and dispatched, you will receive a shipment confirmation email with your tracking number and a direct tracking link. Tracking updates may take a few days to appear after dispatch. You can also track your parcel under My Account → My Orders or via our Track Your Order page.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Shipping Destinations</h2>
        <p className="text-neutral-600">
          We ship to North America (United States, Canada, Mexico), United Kingdom, Europe (Austria, Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Portugal, Spain, Sweden, Norway, Switzerland, Poland, Czech Republic, Slovakia, Hungary, Romania, Bulgaria, Croatia, Slovenia, Estonia, Latvia, Lithuania, Greece, Cyprus, Malta, Ukraine, Russia), Asia (Japan, South Korea, Hong Kong, Taiwan, Singapore, Malaysia, Thailand, Vietnam, Israel, United Arab Emirates), and Oceania (Australia, New Zealand).
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">International Shopping</h2>
        <p className="text-neutral-600">
          If you are browsing from a different country than your delivery destination, you can change the market selection at the top of the website under &quot;International.&quot; Prices, delivery times, and charges may adjust depending on the selected destination.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Import Taxes & Customs Duties</h2>
        <p className="text-neutral-600">
          Prices on thestreetcollector.com do not include local VAT, sales tax, or import duties. If your order exceeds your country&apos;s duty-free threshold, import taxes and customs duties may apply upon delivery. These charges are determined by your local customs authority and are the customer&apos;s responsibility. We recommend contacting your local customs office for details.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Paying Customs Fees</h2>
        <p className="text-neutral-600">
          If duties or taxes apply, your parcel will be held at customs. The local carrier will contact you, and payment must be completed before delivery.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Undeliverable Parcels</h2>
        <p className="text-neutral-600">
          If delivery cannot be completed due to incorrect address, non-payment of customs fees, or failure to collect the parcel, it will be returned to Street Collector. Reshipping fees may apply.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Bank Fees</h2>
        <p className="text-neutral-600">
          Your bank may charge additional cross-border transaction fees. Street Collector does not compensate these charges. Please contact your bank for more information.
        </p>

        <p className="mt-8 text-neutral-600">
          For questions about shipping, contact us at{' '}
          <a href="mailto:info@thestreetlamp.com" className="text-neutral-900 underline hover:no-underline">
            info@thestreetlamp.com
          </a>
          .
        </p>
      </div>
      <Link
        href="/shop"
        className="mt-10 inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        ← Back to Shop
      </Link>
    </>
  )
}
