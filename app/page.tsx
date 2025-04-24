import Link from "next/link"
import { Box, Heading, Text, Button, Container, VStack } from "@chakra-ui/react"

export default function HomePage() {
  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center" py={10}>
          <Heading as="h1" size="2xl" mb={4}>
            Collector Benefits System
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Manage your limited editions and certificates
          </Text>
        </Box>

        <Box p={8} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
          <Heading as="h2" size="lg" mb={6}>
            Admin Navigation
          </Heading>

          <VStack spacing={4} align="stretch">
            <Link href="/admin/certificates/management" passHref>
              <Button as="a" size="lg" width="full" colorScheme="blue">
                Certificate Management
              </Button>
            </Link>

            <Link href="/admin/certificates/logs" passHref>
              <Button as="a" size="lg" width="full" colorScheme="teal">
                Certificate Access Logs
              </Button>
            </Link>

            <Link href="/admin/missing-orders" passHref>
              <Button as="a" size="lg" width="full" colorScheme="purple">
                Missing Orders
              </Button>
            </Link>

            <Link href="/admin/shopify-sync" passHref>
              <Button as="a" size="lg" width="full" colorScheme="orange">
                Shopify Sync
              </Button>
            </Link>

            <Link href="/admin/test-connections" passHref>
              <Button as="a" size="lg" width="full" colorScheme="green">
                Test Connections
              </Button>
            </Link>
          </VStack>
        </Box>

        <Box textAlign="center" py={4}>
          <Text color="gray.500">Collector Benefits System v1.0</Text>
        </Box>
      </VStack>
    </Container>
  )
}
