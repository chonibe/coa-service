"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider } from "./color-mode"

export function Provider(props: any) {
  return (
    <ChakraProvider>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
