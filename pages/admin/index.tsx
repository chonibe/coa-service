import { Box, Container, Heading, Text, VStack, Button, SimpleGrid } from "@chakra-ui/react"
import Link from "next/link"
import Head from "next/head"

export default function AdminDashboard() {
  return (
    <>
      <Head>
        <title>Admin Dashboard - Collector Benefits System</title>
      </Head>

      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={10}>
            <Heading as="h1" size="2xl" mb={4}>
              Admin Dashboard
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Manage your collector benefits system
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
              <Heading as="h3" size="md" mb={4}>
                Certificate Management
              </Heading>
              <Text mb={4} color="gray.600">
                Manage and view certificate details
              </Text>
              <Link href="/admin/certificates/management" passHref>
                <Button as="a" colorScheme="blue" width="full">
                  Go to Certificate Management
                </Button>
              </Link>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
              <Heading as="h3" size="md" mb={4}>
                Certificate Access Logs
              </Heading>
              <Text mb={4} color="gray.600">
                View certificate access history
              </Text>
              <Link href="/admin/certificates/logs" passHref>
                <Button as="a" colorScheme="teal" width="full">
                  View Access Logs
                </Button>
              </Link>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
              <Heading as="h3" size="md" mb={4}>
                Missing Orders
              </Heading>
              <Text mb={4} color="gray.600">
                Check for missing orders in the system
              </Text>
              <Link href="/admin/missing-orders" passHref>
                <Button as="a" colorScheme="purple" width="full">
                  Check Missing Orders
                </Button>
              </Link>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
              <Heading as="h3" size="md" mb={4}>
                Shopify Sync
              </Heading>
              <Text mb={4} color="gray.600">
                Synchronize data with Shopify
              </Text>
              <Link href="/admin/shopify-sync" passHref>
                <Button as="a" colorScheme="orange" width="full">
                  Sync with Shopify
                </Button>
              </Link>
            </Box>

            <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
              <Heading as="h3" size="md" mb={4}>
                Test Connections
              </Heading>
              <Text mb={4} color="gray.600">
                Test system connections and integrations
              </Text>
              <Link href="/admin/test-connections" passHref>
                <Button as="a" colorScheme="green" width="full">
                  Test Connections
                </Button>
              </Link>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </>
  )
}
