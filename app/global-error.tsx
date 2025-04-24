"use client"

import { Box, Heading, Text, Button, Container, ChakraProvider } from "@chakra-ui/react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider>
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
        </ChakraProvider>
      </body>
    </html>
  )
}
