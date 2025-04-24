import { Container, Title, Text, SimpleGrid, Paper, Group, Stat, RingProgress, Center } from "@mantine/core"
import { IconCertificate, IconUsers, IconEye } from "@tabler/icons-react"

export default function AdminDashboard() {
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Admin Dashboard</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="xl">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Total Certificates</Text>
            <IconCertificate size={20} />
          </Group>
          <Text size="xl" fw={500}>1,234</Text>
          <Text size="xs" c="dimmed" mt={7}>+12% from last month</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Active Users</Text>
            <IconUsers size={20} />
          </Group>
          <Text size="xl" fw={500}>567</Text>
          <Text size="xs" c="dimmed" mt={7}>+8% from last month</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Total Views</Text>
            <IconEye size={20} />
          </Group>
          <Text size="xl" fw={500}>8,901</Text>
          <Text size="xs" c="dimmed" mt={7}>+23% from last month</Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Title order={3} mb="md">Certificate Status</Title>
          <Center>
            <RingProgress
              size={200}
              thickness={20}
              sections={[
                { value: 40, color: 'blue', label: 'Active' },
                { value: 30, color: 'green', label: 'Verified' },
                { value: 20, color: 'yellow', label: 'Pending' },
                { value: 10, color: 'red', label: 'Expired' },
              ]}
            />
          </Center>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={3} mb="md">Recent Activity</Title>
          <Text c="dimmed">No recent activity to display</Text>
        </Paper>
      </SimpleGrid>
    </Container>
  )
} 