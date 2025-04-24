import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Stack } from "@mantine/core"
import { IconSearch, IconPlus } from "@tabler/icons-react"

export default function CertificateManagement() {
  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Certificate Management</Title>
        <Button leftSection={<IconPlus size={16} />}>Add Certificate</Button>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Group grow>
            <TextInput
              placeholder="Search certificates..."
              leftSection={<IconSearch size={16} />}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CERT-001</td>
              <td>John Doe</td>
              <td>
                <Text c="green">Active</Text>
              </td>
              <td>2024-01-15</td>
              <td>
                <Group gap="xs">
                  <Button variant="subtle" size="xs">View</Button>
                  <Button variant="subtle" size="xs">Edit</Button>
                </Group>
              </td>
            </tr>
            <tr>
              <td>CERT-002</td>
              <td>Jane Smith</td>
              <td>
                <Text c="yellow">Pending</Text>
              </td>
              <td>2024-02-20</td>
              <td>
                <Group gap="xs">
                  <Button variant="subtle" size="xs">View</Button>
                  <Button variant="subtle" size="xs">Edit</Button>
                </Group>
              </td>
            </tr>
          </tbody>
        </Table>
      </Paper>
    </Container>
  )
} 