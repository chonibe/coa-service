"use client"

import { Box, Heading, Text, Button, Container } from "@chakra-ui/react"
import { useEffect } from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <Container maxW="container.md" py={20}>
      <Box textAlign="center" p={8} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
        <Heading as="h2" size="xl" mb={4} color="red.500">
          Something went wrong!
        </Heading>
        <Text fontSize="lg" mb={6}>
          {error.message || "An unexpected error occurred"}
        </Text>
        <Button colorScheme="blue" onClick={reset}>
          Try again
        </Button>
      </Box>
    </Container>
  )
}
