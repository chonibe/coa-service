"use client"

import { Container, Title, Text, Paper, Group, Button, Stack, Grid, Card, Badge } from "@mantine/core"
import { IconCurrencyDollar, IconFileCertificate, IconShoppingCart, IconUsers, IconRefresh, IconSettings, IconList, IconTag } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DashboardStats {
  totalOrders: number
  totalAmount: number
  pendingOrders: number
  completedOrders: number
  totalCertificates: number
  activeCertificates: number
  totalVendors: number
  activeVendors: number
  pendingPayouts: number
  totalPayouts: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalAmount: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCertificates: 0,
    activeCertificates: 0,
    totalVendors: 0,
    activeVendors: 0,
    pendingPayouts: 0,
    totalPayouts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch orders stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, amount')
      
      const orders = ordersData || []
      const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0)
      const pendingOrders = orders.filter(o => o.status === 'pending').length
      const completedOrders = orders.filter(o => o.status === 'completed').length

      // Fetch certificates stats
      const { data: certificatesData } = await supabase
        .from('certificates')
        .select('status')
      
      const certificates = certificatesData || []
      const activeCertificates = certificates.filter(c => c.status === 'active').length

      // Fetch vendors stats
      const { data: vendorsData } = await supabase
        .from('users')
        .select('role')
        .eq('role', 'vendor')
      
      const vendors = vendorsData || []
      const activeVendors = vendors.length

      // Fetch payouts stats
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('status')
      
      const payouts = payoutsData || []
      const pendingPayouts = payouts.filter(p => p.status === 'pending').length

      setStats({
        totalOrders: orders.length,
        totalAmount,
        pendingOrders,
        completedOrders,
        totalCertificates: certificates.length,
        activeCertificates,
        totalVendors: vendors.length,
        activeVendors,
        pendingPayouts,
        totalPayouts: payouts.length
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const QuickAction = ({ icon: Icon, title, href, color }: { 
    icon: any, 
    title: string, 
    href: string,
    color?: string 
  }) => (
    <Button
      component={Link}
      href={href}
      variant="light"
      color={color}
      leftSection={<Icon size={20} />}
      style={{ flex: 1 }}
    >
      {title}
    </Button>
  )

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Dashboard</Title>
        <Button 
          leftSection={<IconRefresh size={16} />}
          onClick={fetchStats}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Orders</Text>
              <Group gap="xs">
                <IconShoppingCart size={24} />
                <Title order={3}>{stats.totalOrders}</Title>
              </Group>
              <Group gap="xs">
                <Badge color="yellow">Pending: {stats.pendingOrders}</Badge>
                <Badge color="green">Completed: {stats.completedOrders}</Badge>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Revenue</Text>
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
              <Text size="sm" c="dimmed">Certificates</Text>
              <Group gap="xs">
                <IconFileCertificate size={24} />
                <Title order={3}>{stats.totalCertificates}</Title>
              </Group>
              <Badge color="green">Active: {stats.activeCertificates}</Badge>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Vendors</Text>
              <Group gap="xs">
                <IconUsers size={24} />
                <Title order={3}>{stats.totalVendors}</Title>
              </Group>
              <Badge color="green">Active: {stats.activeVendors}</Badge>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Title order={2} size="h4">Quick Actions</Title>
          <Group grow>
            <QuickAction 
              icon={IconList} 
              title="Products" 
              href="/admin/products"
              color="blue"
            />
            <QuickAction 
              icon={IconRefresh} 
              title="Sync Products" 
              href="/admin/products/sync"
              color="green"
            />
            <QuickAction 
              icon={IconTag} 
              title="Product Editions" 
              href="/admin/products/editions"
              color="yellow"
            />
            <QuickAction 
              icon={IconUsers} 
              title="Sync Vendor Names" 
              href="/admin/vendors/sync"
              color="orange"
            />
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Stack>
          <Title order={2} size="h4">Recent Activity</Title>
          <Group grow>
            <QuickAction 
              icon={IconShoppingCart} 
              title="Orders" 
              href="/admin/orders"
              color="blue"
            />
            <QuickAction 
              icon={IconUsers} 
              title="Vendors" 
              href="/admin/vendors"
              color="green"
            />
            <QuickAction 
              icon={IconCurrencyDollar} 
              title="Payouts" 
              href="/admin/payouts"
              color="yellow"
            />
            <QuickAction 
              icon={IconFileCertificate} 
              title="Certificates" 
              href="/admin/certificates"
              color="orange"
            />
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
} 