"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react"

type ColorMode = "light" | "dark" | "system"
type ColorModeContextType = {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
}

const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: "system",
  setColorMode: () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

export function ColorModeProvider({ value, children }: { value: any; children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>("system")

  useEffect(() => {
    const savedMode = localStorage.getItem("chakra-ui-color-mode") as ColorMode | null
    if (savedMode) {
      setColorMode(savedMode)
    }
  }, [])

  const handleSetColorMode = (mode: ColorMode) => {
    setColorMode(mode)
    localStorage.setItem("chakra-ui-color-mode", mode)
  }

  return (
    <>
      <ColorModeScript initialColorMode={value.config.initialColorMode} />
      <ColorModeContext.Provider value={{ colorMode, setColorMode: handleSetColorMode }}>
        <ChakraProvider theme={value}>{children}</ChakraProvider>
      </ColorModeContext.Provider>
    </>
  )
}
