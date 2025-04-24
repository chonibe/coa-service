import { Box, Container, Heading, Text, Button, VStack } from "@chakra-ui/react"
import Link from "next/link"
import Head from "next/head"

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>

      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" p={8} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Heading as="h1" size="2xl" mb={4}>
              404 - Page Not Found
            </Heading>
            <Text fontSize="xl" mb={8} color="gray.600">
              The page you are looking for does not exist.
            </Text>
            <Link href="/" passHref>
              <Button as="a" colorScheme="blue" size="lg">
                Return to Home
              </Button>
            </Link>
          </Box>
        </VStack>
      </Container>
    </>
  )
}
