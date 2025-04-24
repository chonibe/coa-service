"use client"

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Center,
  useColorModeValue,
} from "@chakra-ui/react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorFallbackProps {
  error: string
  resetErrorBoundary: () => void
  isRetrying?: boolean
}

export function ErrorFallback({ error, resetErrorBoundary, isRetrying = false }: ErrorFallbackProps) {
  const bgColor = useColorModeValue("gray.50", "gray.700")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  return (
    <Box p={4} rounded="lg" border="1px" bg={bgColor} borderColor={borderColor}>
      <Alert status="error" mb={4}>
        <AlertIcon as={AlertCircle} />
        <Box>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>

      <Center>
        <Button onClick={resetErrorBoundary} isDisabled={isRetrying}>
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </Center>
    </Box>
  )
}
