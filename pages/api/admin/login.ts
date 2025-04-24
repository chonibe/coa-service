import type { NextApiRequest, NextApiResponse } from "next"
import { serialize } from "cookie"

type Data = {
  success: boolean
  message?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  const { password } = req.body

  // Check if the password matches the admin password
  if (password === process.env.ADMIN_PASSWORD) {
    // Set a cookie with the admin token
    const token = "admin-token-" + Date.now()

    res.setHeader(
      "Set-Cookie",
      serialize("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
        sameSite: "strict",
      }),
    )

    return res.status(200).json({ success: true })
  }

  return res.status(401).json({ success: false, message: "Invalid password" })
}
