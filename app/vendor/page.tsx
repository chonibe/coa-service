"use client"

import { Container, Title, Text, Paper, Grid, Card, Group, Badge, Table, Stack, Button } from "@mantine/core"
import { IconCurrencyDollar, IconShoppingCart, IconFileCertificate, IconRefresh } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface VendorStats {
  totalEarnings: number
  pendingPayouts: number
  completedOrders: number
  activeCertificates: number
}

interface Order {
  id: string
  user_id: string
  status: string
  amount: number
  created_at: string
  user: {
    name: string
    email: string
  }
}

interface Certificate {
  id: string
  owner_id: string
  status: string
  created_at: string
  owner: {
    name: string
    email: string
  }
}

export default function VendorPortal() {
  const [stats, setStats] = useState<VendorStats>({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedOrders: 0,
    activeCertificates: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentCertificates, setRecentCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendorData()
  }, [])

  const fetchVendorData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch vendor stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, amount')
        .eq('vendor_id', user.id)

      const { data: certificatesData } = await supabase
        .from('certificates')
        .select('status')
        .eq('vendor_id', user.id)

      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('status, amount')
        .eq('vendor_id', user.id)

      const totalEarnings = ordersData?.reduce((sum, order) => sum + order.amount, 0) || 0
      const pendingPayouts = payoutsData?.filter(p => p.status === 'pending').length || 0
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0
      const activeCertificates = certificatesData?.filter(c => c.status === 'active').length || 0

      setStats({
        totalEarnings,
        pendingPayouts,
        completedOrders,
        activeCertificates,
      })

      // Fetch recent orders
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          *,
          user:users!user_id(name, email)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentOrders(recentOrdersData || [])

      // Fetch recent certificates
      const { data: recentCertificatesData } = await supabase
        .from('certificates')
        .select(`
          *,
          owner:users!owner_id(name, email)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentCertificates(recentCertificatesData || [])
    } catch (error) {
      console.error('Failed to fetch vendor data:', error)
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
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Vendor Portal</Title>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={fetchVendorData}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Earnings</Text>
              <Group gap="xs">
                <IconCurrencyDollar size={24} />
                <Title order={3}>${stats.totalEarnings.toFixed(2)}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Pending Payouts</Text>
              <Group gap="xs">
                <IconCurrencyDollar size={24} />
                <Title order={3}>{stats.pendingPayouts}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Completed Orders</Text>
              <Group gap="xs">
                <IconShoppingCart size={24} />
                <Title order={3}>{stats.completedOrders}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Active Certificates</Text>
              <Group gap="xs">
                <IconFileCertificate size={24} />
                <Title order={3}>{stats.activeCertificates}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={2} size="h4" mb="md">Recent Orders</Title>
            <Table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Stack gap={0}>
                        <Text>{order.user?.name}</Text>
                        <Text size="sm" c="dimmed">{order.user?.email}</Text>
                      </Stack>
                    </td>
                    <td>${order.amount.toFixed(2)}</td>
                    <td>
                      <Badge color={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Title order={2} size="h4" mb="md">Recent Certificates</Title>
            <Table>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCertificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td>
                      <Stack gap={0}>
                        <Text>{certificate.owner?.name}</Text>
                        <Text size="sm" c="dimmed">{certificate.owner?.email}</Text>
                      </Stack>
                    </td>
                    <td>
                      <Badge color={getStatusColor(certificate.status)}>
                        {certificate.status}
                      </Badge>
                    </td>
                    <td>{new Date(certificate.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  )
} 