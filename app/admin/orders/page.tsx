"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Badge, Stack, Modal, ActionIcon, Code } from "@mantine/core"
import { IconSearch, IconEye, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabaseAdmin } from "@/lib/supabase"
import { useDisclosure } from "@mantine/hooks"

interface Order {
  id: string
  user_id: string
  vendor_id: string
  status: string
  amount: number
  metadata: any
  created_at: string
  updated_at: string
  user: {
    name: string
    email: string
  }
  vendor: {
    name: string
    email: string
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    fetchOrders()
  }, [search, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          user:users!user_id(name, email),
          vendor:users!vendor_id(name, email)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`user.name.ilike.%${search}%,user.email.ilike.%${search}%,vendor.name.ilike.%${search}%`)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'cancelled':
        return 'red'
      case 'pending':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Orders</Title>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setSelectedOrder(null)
            open()
          }}
        >
          New Order
        </Button>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} align="center">
                  <Text>Loading...</Text>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} align="center">
                  <Text>No orders found</Text>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Stack gap={0}>
                      <Text>{order.user?.name}</Text>
                      <Text size="sm" c="dimmed">{order.user?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Stack gap={0}>
                      <Text>{order.vendor?.name}</Text>
                      <Text size="sm" c="dimmed">{order.vendor?.email}</Text>
                    </Stack>
                  </td>
                  <td>${order.amount.toFixed(2)}</td>
                  <td>
                    <Badge color={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Group gap="xs">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedOrder(order)
                          open()
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedOrder(order)
                          open()
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="red"
                        onClick={() => handleDelete(order.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Paper>

      <Modal 
        opened={opened} 
        onClose={close} 
        title={selectedOrder ? "Edit Order" : "New Order"}
        size="lg"
      >
        <Stack>
          <TextInput
            label="User Email"
            placeholder="user@example.com"
            value={selectedOrder?.user?.email || ''}
          />
          <TextInput
            label="Vendor Email"
            placeholder="vendor@example.com"
            value={selectedOrder?.vendor?.email || ''}
          />
          <TextInput
            label="Amount"
            type="number"
            placeholder="0.00"
            value={selectedOrder?.amount || ''}
          />
          <Select
            label="Status"
            value={selectedOrder?.status || 'pending'}
            data={[
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          {selectedOrder?.metadata && (
            <Box>
              <Text size="sm" fw={500}>Metadata</Text>
              <Code block>
                {JSON.stringify(selectedOrder.metadata, null, 2)}
              </Code>
            </Box>
          )}
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button>
              {selectedOrder ? 'Save Changes' : 'Create Order'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
} 