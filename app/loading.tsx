import { Spinner, Text, Container, VStack } from "@chakra-ui/react"

export default function Loading() {
  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={6}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        <Text fontSize="xl">Loading...</Text>
      </VStack>
    </Container>
  )
}
