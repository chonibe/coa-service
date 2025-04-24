import Link from "next/link"

export default function ErrorPage({ searchParams }: { searchParams: { code?: string } }) {
  const errorCode = searchParams?.code || "404"
  const errorMessages: Record<string, string> = {
    "404": "The page you are looking for does not exist.",
    "500": "An internal server error occurred.",
    default: "An error occurred.",
  }

  const message = errorMessages[errorCode] || errorMessages.default

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
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
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "1rem",
            color: "#333",
          }}
        >
          Error {errorCode}
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            marginBottom: "2rem",
            color: "#666",
          }}
        >
          {message}
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3182ce",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
