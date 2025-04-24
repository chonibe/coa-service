import Link from "next/link"

export default function HomePage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ textAlign: "center", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1a202c" }}>Collector Benefits System</h1>
        <p style={{ fontSize: "1.25rem", color: "#4a5568" }}>Manage your limited editions and certificates</p>
      </div>

      <div
        style={{
          padding: "2rem",
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1a202c" }}>Admin Navigation</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link
            href="/admin/certificates/management"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "#3182ce",
              color: "white",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Certificate Management
          </Link>

          <Link
            href="/admin/certificates/logs"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "#319795",
              color: "white",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Certificate Access Logs
          </Link>

          <Link
            href="/admin/missing-orders"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "#805ad5",
              color: "white",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Missing Orders
          </Link>

          <Link
            href="/admin/shopify-sync"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "#dd6b20",
              color: "white",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Shopify Sync
          </Link>

          <Link
            href="/admin/test-connections"
            style={{
              display: "block",
              padding: "0.75rem 1rem",
              backgroundColor: "#38a169",
              color: "white",
              borderRadius: "0.25rem",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Test Connections
          </Link>
        </div>
      </div>

      <div style={{ textAlign: "center", paddingTop: "1rem", paddingBottom: "1rem" }}>
        <p style={{ color: "#718096" }}>Collector Benefits System v1.0</p>
      </div>
    </div>
  )
}
