import { Container, Title, Text, Button, Box, SimpleGrid, Paper } from "@mantine/core"
import Link from "next/link"

export default function Page() {
  return (
    <Container size="xl" py="xl">
      <Box className="flex flex-col gap-8">
        <Paper p="xl" radius="md" withBorder>
          <Title order={1} ta="center" mb="md">
            Collector Benefits System
          </Title>
          <Text size="xl" c="dimmed" ta="center">
            Manage your limited editions and certificates
          </Text>
        </Paper>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <Paper p="xl" radius="md" withBorder>
            <Title order={3} mb="md">
              Certificate Management
            </Title>
            <Text mb="md" c="dimmed">
              Manage and view certificate details
            </Text>
            <Link href="/admin/certificates/management" passHref>
              <Button component="a" fullWidth>
                Go to Certificate Management
              </Button>
            </Link>
          </Paper>

          <Paper p="xl" radius="md" withBorder>
            <Title order={3} mb="md">
              Certificate Access Logs
            </Title>
            <Text mb="md" c="dimmed">
              View certificate access history
            </Text>
            <Link href="/admin/certificates/logs" passHref>
              <Button component="a" fullWidth variant="light">
                View Access Logs
              </Button>
            </Link>
          </Paper>

          <Paper p="xl" radius="md" withBorder>
            <Title order={3} mb="md">
              Missing Orders
            </Title>
            <Text mb="md" c="dimmed">
              Check for missing orders in the system
            </Text>
            <Link href="/admin/missing-orders" passHref>
              <Button component="a" fullWidth variant="outline">
                Check Missing Orders
              </Button>
            </Link>
          </Paper>
        </SimpleGrid>
      </Box>
    </Container>
  )
}
