```typescriptreact file="components/ui/provider.tsx"
[v0-no-op-code-block-prefix]"use client"

import { ChakraProvider } from "@chakra-ui/react"

export function Provider(props: any) {
  return (
    <ChakraProvider>
    </ChakraProvider>
  )
}
