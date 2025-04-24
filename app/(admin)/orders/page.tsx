"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box } from "@mantine/core"
import { IconSearch, IconPlus } from "@tabler/icons-react"

export default function Orders() {
  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Orders</Title>
        <Button leftSection={<IconPlus size={16} />}>Add Order</Button>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Box className="flex flex-col">
          <Group grow>
            <TextInput
              placeholder="Search orders..."
              leftSection={<IconSearch size={16} />}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </Group>
        </Box>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Date</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#1234</td>
              <td>John Doe</td>
              <td>
                <Text c="green">Completed</Text>
              </td>
              <td>2024-03-15</td>
              <td>$99.99</td>
              <td>
                <Group gap="xs">
                  <Button variant="subtle" size="xs">View</Button>
                  <Button variant="subtle" size="xs">Edit</Button>
                </Group>
              </td>
            </tr>
            <tr>
              <td>#1235</td>
              <td>Jane Smith</td>
              <td>
                <Text c="yellow">Processing</Text>
              </td>
              <td>2024-03-16</td>
              <td>$149.99</td>
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