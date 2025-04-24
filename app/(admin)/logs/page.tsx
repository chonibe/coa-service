import { Container, Title, Text, Paper, Table, Group, TextInput, Select, Stack, Badge } from "@mantine/core"
import { IconSearch, IconClock } from "@tabler/icons-react"

export default function AccessLogs() {
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Access Logs</Title>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Group grow>
            <TextInput
              placeholder="Search logs..."
              leftSection={<IconSearch size={16} />}
            />
            <Select
              placeholder="Filter by type"
              data={[
                { value: 'view', label: 'View' },
                { value: 'edit', label: 'Edit' },
                { value: 'delete', label: 'Delete' },
              ]}
            />
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Certificate ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text>2024-03-15 14:30</Text>
                </Group>
              </td>
              <td>john.doe@example.com</td>
              <td>
                <Badge color="blue">View</Badge>
              </td>
              <td>CERT-001</td>
              <td>192.168.1.1</td>
            </tr>
            <tr>
              <td>
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text>2024-03-15 14:25</Text>
                </Group>
              </td>
              <td>jane.smith@example.com</td>
              <td>
                <Badge color="green">Edit</Badge>
              </td>
              <td>CERT-002</td>
              <td>192.168.1.2</td>
            </tr>
          </tbody>
        </Table>
      </Paper>
    </Container>
  )
} 