"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            padding: "0 1rem",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              padding: "2rem",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              backgroundColor: "white",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                marginBottom: "1rem",
                color: "#e53e3e",
              }}
            >
              Something went wrong!
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                marginBottom: "1.5rem",
                color: "#666",
              }}
            >
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
