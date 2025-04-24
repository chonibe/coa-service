"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Modal, Badge, Stack, Grid, Card, Code } from "@mantine/core"
import { IconSearch, IconEye, IconCurrencyDollar, IconCalendar, IconUser, IconInfoCircle } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useDisclosure } from "@mantine/hooks"
import { DatePickerInput } from "@mantine/dates"

interface Order {
  id: string
  user_id: string
  user: {
    name: string
    email: string
  }
  status: string
  amount: number
  created_at: string
  metadata: any
}

interface SearchFilters {
  orderId?: string
  customerName?: string
  customerEmail?: string
  status?: string
  dateRange?: [Date | null, Date | null]
  minAmount?: number
  maxAmount?: number
}

export default function OrderLookup() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    pendingOrders: 0,
    completedOrders: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.orderId) {
        query = query.eq('id', filters.orderId)
      }
      if (filters.customerName) {
        query = query.ilike('user.name', `%${filters.customerName}%`)
      }
      if (filters.customerEmail) {
        query = query.ilike('user.email', `%${filters.customerEmail}%`)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateRange?.[0]) {
        query = query.gte('created_at', filters.dateRange[0].toISOString())
      }
      if (filters.dateRange?.[1]) {
        query = query.lte('created_at', filters.dateRange[1].toISOString())
      }
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount)
      }
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate stats
      const totalAmount = data?.reduce((sum, order) => sum + order.amount, 0) || 0
      const pendingOrders = data?.filter(o => o.status === 'pending').length || 0
      const completedOrders = data?.filter(o => o.status === 'completed').length || 0

      setStats({
        totalOrders: data?.length || 0,
        totalAmount,
        pendingOrders,
        completedOrders
      })

      setOrders(data || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Order Lookup</Title>

      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Orders</Text>
              <Group gap="xs">
                <IconInfoCircle size={24} />
                <Title order={3}>{stats.totalOrders}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Amount</Text>
              <Group gap="xs">
                <IconCurrencyDollar size={24} />
                <Title order={3}>${stats.totalAmount.toFixed(2)}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Pending Orders</Text>
              <Group gap="xs">
                <IconCalendar size={24} />
                <Title order={3}>{stats.pendingOrders}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Completed Orders</Text>
              <Group gap="xs">
                <IconInfoCircle size={24} />
                <Title order={3}>{stats.completedOrders}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Group grow>
            <TextInput
              placeholder="Order ID"
              value={filters.orderId || ''}
              onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
            />
            <TextInput
              placeholder="Customer Name"
              value={filters.customerName || ''}
              onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
            />
            <TextInput
              placeholder="Customer Email"
              value={filters.customerEmail || ''}
              onChange={(e) => setFilters({ ...filters, customerEmail: e.target.value })}
            />
          </Group>
          <Group grow>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value || undefined })}
              data={[
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <DatePickerInput
              type="range"
              label="Date Range"
              placeholder="Pick date range"
              value={filters.dateRange}
              onChange={(value) => setFilters({ ...filters, dateRange: value })}
            />
            <Group grow>
              <TextInput
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters({ ...filters, minAmount: parseFloat(e.target.value) })}
              />
              <TextInput
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) })}
              />
            </Group>
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
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
                  <td>{order.id}</td>
                  <td>
                    <Stack gap={0}>
                      <Text>{order.user?.name}</Text>
                      <Text size="sm" c="dimmed">{order.user?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Group gap="xs">
                      <IconCurrencyDollar size={14} />
                      <Text>{order.amount.toFixed(2)}</Text>
                    </Group>
                  </td>
                  <td>
                    <Badge color={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Button 
                      variant="subtle" 
                      size="xs"
                      leftSection={<IconEye size={14} />}
                      onClick={() => {
                        setSelectedOrder(order)
                        open()
                      }}
                    >
                      View
                    </Button>
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
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <Stack>
            <Box>
              <Text size="sm" fw={500}>Order ID</Text>
              <Text>{selectedOrder.id}</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={500}>Customer</Text>
              <Stack gap={0}>
                <Text>{selectedOrder.user?.name}</Text>
                <Text size="sm" c="dimmed">{selectedOrder.user?.email}</Text>
              </Stack>
            </Box>
            
            <Box>
              <Text size="sm" fw={500}>Amount</Text>
              <Group gap="xs">
                <IconCurrencyDollar size={14} />
                <Text>${selectedOrder.amount.toFixed(2)}</Text>
              </Group>
            </Box>
            
            <Box>
              <Text size="sm" fw={500}>Status</Text>
              <Badge color={getStatusColor(selectedOrder.status)}>
                {selectedOrder.status}
              </Badge>
            </Box>
            
            <Box>
              <Text size="sm" fw={500}>Created</Text>
              <Text>{new Date(selectedOrder.created_at).toLocaleString()}</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={500}>Metadata</Text>
              <Code block>
                {JSON.stringify(selectedOrder.metadata, null, 2)}
              </Code>
            </Box>
          </Stack>
        )}
      </Modal>
    </Container>
  )
} 