"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

export function FloatingCreateButton() {
  const router = useRouter()

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => router.push("/vendor/dashboard/products/create")}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </motion.div>
  )
}

