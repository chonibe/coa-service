import * as jose from "jose"

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "secret" // Replace with a strong secret key

export async function verifyJWT(token: string): Promise<boolean> {
  try {
    if (!JWT_SECRET_KEY) {
      console.error("JWT_SECRET_KEY is not set")
      return false
    }

    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    await jose.jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })
    return true
  } catch (error) {
    console.error("JWT verification failed:", error)
    return false
  }
}
