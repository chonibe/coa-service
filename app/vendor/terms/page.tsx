import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Vendor Terms of Service | Street Collector",
}

export default function VendorTermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/vendor/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Vendor Terms of Service</h1>

          <p className="lead">
            This document outlines the terms and conditions for vendors (artists) selling artwork on the Street Collector platform. By submitting products for approval, vendors agree to these terms.
          </p>

          <h2>Commission Structure</h2>

          <h3>Standard Commission Rate</h3>
          <ul>
            <li><strong>Vendor Commission</strong>: 25% of the product&apos;s retail price</li>
            <li><strong>Platform Fee</strong>: 75% of the product&apos;s retail price</li>
            <li>Commission is calculated on the final sale price (after any discounts)</li>
          </ul>

          <h3>Payout Schedule</h3>
          <ul>
            <li>Payouts are processed after order fulfillment</li>
            <li>Default payout schedule: Bi-weekly</li>
            <li>Vendors can configure payout preferences (weekly, bi-weekly, monthly)</li>
            <li>Instant payouts available with applicable fees</li>
          </ul>

          <h2>First Edition Reserve Policy</h2>

          <h3>Policy Overview</h3>
          <p>
            Street Collector maintains a collection of first editions for the Street Collector archive. When you submit artwork for approval, you agree to the following:
          </p>

          <h3>First Edition Reservation</h3>
          <ol>
            <li>
              <strong>Automatic Reservation</strong>: Edition #1 of all approved artworks is automatically reserved for the Street Collector collection
            </li>
            <li>
              <strong>Commission Payment</strong>: You will receive your standard 25% commission on the reserved first edition, calculated on the product&apos;s retail price
            </li>
            <li>
              <strong>Public Sales</strong>: Public sales of your artwork will begin from edition #2 onwards
            </li>
            <li>
              <strong>No Impact on Your Rights</strong>: This reservation does not affect your intellectual property rights, your ability to sell additional editions, your standard commission on all public sales, or your ownership of the artwork
            </li>
          </ol>

          <h3>Example</h3>
          <p>If your artwork is priced at $100:</p>
          <ul>
            <li>
              <strong>Edition #1</strong>: Reserved for Street Collector collection — You receive $25 (25% commission)
            </li>
            <li>
              <strong>Edition #2+</strong>: Available for public purchase — You receive $25 per sale (25% commission), customer pays $100 per edition
            </li>
          </ul>

          <h3>Benefits of First Edition Reserve</h3>
          <ul>
            <li><strong>Collection Building</strong>: Your work becomes part of the Street Collector permanent collection</li>
            <li><strong>Brand Association</strong>: First editions may be featured in exhibitions, marketing, or showcases</li>
            <li><strong>Historical Value</strong>: First editions often hold special significance in art collections</li>
            <li><strong>Platform Investment</strong>: Demonstrates the platform&apos;s commitment to preserving artwork history</li>
          </ul>

          <h2>Product Submission and Approval</h2>

          <h3>Submission Process</h3>
          <ol>
            <li>Submit product through vendor dashboard</li>
            <li>Product reviewed by admin team</li>
            <li>Admin may request changes or clarification</li>
            <li>Upon approval, product is published to the store</li>
            <li>First edition is automatically reserved (as per policy above)</li>
          </ol>

          <h3>Approval Criteria</h3>
          <ul>
            <li>Product meets quality standards</li>
            <li>All required information provided</li>
            <li>Images meet specifications</li>
            <li>Pricing is appropriate</li>
            <li>Compliance with platform guidelines</li>
          </ul>

          <h2>Intellectual Property</h2>

          <h3>Vendor Rights</h3>
          <ul>
            <li>You retain all intellectual property rights to your artwork</li>
            <li>You grant Street Collector a license to display, market, and promote your artwork, reserve first editions as per policy, and use artwork images for platform marketing (with attribution)</li>
          </ul>

          <h3>Platform Rights</h3>
          <ul>
            <li>Reserve edition #1 of approved artworks</li>
            <li>Display and market artwork on the platform</li>
            <li>Use artwork in platform marketing materials (with attribution)</li>
            <li>Maintain first edition in the Street Collector collection</li>
          </ul>

          <h2>Payment Terms</h2>

          <h3>Commission Calculation</h3>
          <ul>
            <li>Commission calculated on final sale price</li>
            <li>Applied to all fulfilled orders</li>
            <li>Excludes cancelled, refunded, or restocked items</li>
          </ul>

          <h3>Payment Methods</h3>
          <ul>
            <li>PayPal</li>
            <li>Stripe</li>
            <li>Bank Transfer (for larger payouts)</li>
          </ul>

          <h3>Tax Obligations</h3>
          <ul>
            <li>Vendors responsible for their own tax obligations</li>
            <li>Platform may request tax information for compliance</li>
            <li>Self-billing invoices provided where applicable</li>
          </ul>

          <h2>Product Guidelines</h2>

          <h3>Quality Standards</h3>
          <ul>
            <li>High-resolution images required</li>
            <li>Accurate product descriptions</li>
            <li>Proper edition numbering</li>
            <li>Compliance with copyright laws</li>
          </ul>

          <h3>Prohibited Content</h3>
          <ul>
            <li>Copyrighted material without permission</li>
            <li>Offensive or illegal content</li>
            <li>Misleading product information</li>
            <li>Counterfeit or unauthorized reproductions</li>
          </ul>

          <h2>Account Management</h2>

          <h3>Vendor Responsibilities</h3>
          <ul>
            <li>Maintain accurate account information</li>
            <li>Respond to customer inquiries</li>
            <li>Fulfill orders in a timely manner</li>
            <li>Comply with platform policies</li>
          </ul>

          <h3>Platform Responsibilities</h3>
          <ul>
            <li>Process payouts according to schedule</li>
            <li>Provide vendor dashboard and tools</li>
            <li>Handle customer service inquiries</li>
            <li>Maintain platform security</li>
          </ul>

          <h2>Termination</h2>

          <h3>Vendor Termination</h3>
          <ul>
            <li>Vendors may terminate their account at any time</li>
            <li>Pending payouts will be processed</li>
            <li>Products may remain on the platform (with vendor consent)</li>
          </ul>

          <h3>Platform Termination</h3>
          <ul>
            <li>Platform may terminate accounts for policy violations</li>
            <li>Outstanding payouts will be processed</li>
            <li>Products may be removed from the platform</li>
          </ul>

          <h2>Dispute Resolution</h2>

          <h3>Payment Disputes</h3>
          <ul>
            <li>Contact support for payment-related issues</li>
            <li>Disputes reviewed within 30 days</li>
            <li>Documentation may be required</li>
          </ul>

          <h3>Product Disputes</h3>
          <ul>
            <li>Admin team reviews product-related disputes</li>
            <li>Decisions are final</li>
            <li>Appeals process available for significant issues</li>
          </ul>

          <h2>Updates to Terms</h2>
          <ul>
            <li>Terms may be updated periodically</li>
            <li>Vendors will be notified of significant changes</li>
            <li>Continued use of platform constitutes acceptance</li>
          </ul>

          <h2>Contact</h2>
          <p>
            For questions about these terms, email{" "}
            <a href="mailto:support@thestreetcollector.com">support@thestreetcollector.com</a>{" "}
            or visit the Help &amp; Support section in your Vendor Dashboard.
          </p>

          <h2>Acceptance</h2>
          <p>
            By submitting products for approval, you acknowledge that you have read, understood, and agree to these Vendor Terms of Service, including the First Edition Reserve Policy.
          </p>

          <hr />

          <p className="text-sm text-muted-foreground">
            <strong>Last Updated</strong>: January 26, 2026 &bull; <strong>Version</strong>: 1.0
          </p>
        </article>
      </div>
    </div>
  )
}
