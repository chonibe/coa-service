import type { NextApiRequest, NextApiResponse } from "next"
import { serialize } from "cookie"

type Data = {
  success: boolean
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false })
  }

  // Clear the admin token cookie
  res.setHeader(
    "Set-Cookie",
    serialize("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      expires: new Date(0),
      path: "/",
      sameSite: "strict",
    }),
  )

  return res.status(200).json({ success: true })
}
