import { Box, Container, Heading, Text } from "@chakra-ui/react"

export default function Page() {
  return (
    <Container maxW="container.xl" py={10}>
      <Box textAlign="center" py={10}>
        <Heading as="h1" size="2xl" mb={4}>
          Collector Benefits System
        </Heading>
        <Text fontSize="xl" color="gray.600">
          Welcome!
        </Text>
      </Box>
    </Container>
  )
}
