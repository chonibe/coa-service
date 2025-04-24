"use client"

import { ChakraProvider, Box } from "@chakra-ui/react"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        {children}
      </Box>
    </ChakraProvider>
  )
}
