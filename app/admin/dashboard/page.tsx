"use client"

import { Container, Title, Text, Paper, Group, Button, Stack, Grid, Card, Badge, Table } from "@mantine/core"
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
  totalProducts: number
  activeProducts: number
  totalEditions: number
  totalVariants: number
  totalLineItems: number
}

interface TableData {
  products: any[]
  orders: any[]
  certificates: any[]
  vendors: any[]
  payouts: any[]
  editions: any[]
  variants: any[]
  lineItems: any[]
}

export default function AdminDashboard() {
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
    totalPayouts: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalEditions: 0,
    totalVariants: 0,
    totalLineItems: 0
  })
  const [tableData, setTableData] = useState<TableData>({
    products: [],
    orders: [],
    certificates: [],
    vendors: [],
    payouts: [],
    editions: [],
    variants: [],
    lineItems: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch all tables data
      const [
        { data: productsData },
        { data: ordersData },
        { data: certificatesData },
        { data: vendorsData },
        { data: payoutsData },
        { data: editionsData },
        { data: variantsData },
        { data: lineItemsData }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('users').select('*').eq('role', 'vendor'),
        supabase.from('payouts').select('*'),
        supabase.from('editions').select('*'),
        supabase.from('variants').select('*'),
        supabase.from('line_items').select('*')
      ])

      // Calculate stats
      const orders = ordersData || []
      const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0)
      const pendingOrders = orders.filter(o => o.status === 'pending').length
      const completedOrders = orders.filter(o => o.status === 'completed').length

      const certificates = certificatesData || []
      const activeCertificates = certificates.filter(c => c.status === 'active').length

      const vendors = vendorsData || []
      const activeVendors = vendors.length

      const payouts = payoutsData || []
      const pendingPayouts = payouts.filter(p => p.status === 'pending').length

      const products = productsData || []
      const activeProducts = products.filter(p => p.status === 'active').length

      const editions = editionsData || []
      const variants = variantsData || []
      const lineItems = lineItemsData || []

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
        totalPayouts: payouts.length,
        totalProducts: products.length,
        activeProducts,
        totalEditions: editions.length,
        totalVariants: variants.length,
        totalLineItems: lineItems.length
      })

      setTableData({
        products: products,
        orders: orders,
        certificates: certificates,
        vendors: vendors,
        payouts: payouts,
        editions: editions,
        variants: variants,
        lineItems: lineItems
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
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
      <Title order={1} mb="xl">Admin Dashboard</Title>

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
              <Text size="sm" c="dimmed">Products</Text>
              <Group gap="xs">
                <IconList size={24} />
                <Title order={3}>{stats.totalProducts}</Title>
              </Group>
              <Badge color="green">Active: {stats.activeProducts}</Badge>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Editions & Variants</Text>
              <Group gap="xs">
                <IconTag size={24} />
                <Title order={3}>{stats.totalEditions + stats.totalVariants}</Title>
              </Group>
              <Group gap="xs">
                <Badge color="blue">Editions: {stats.totalEditions}</Badge>
                <Badge color="orange">Variants: {stats.totalVariants}</Badge>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Title order={2} size="h4">Recent Products</Title>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tableData.products.slice(0, 5).map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td><Badge color={product.status === 'active' ? 'green' : 'red'}>{product.status}</Badge></td>
                  <td>{new Date(product.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack>
          <Title order={2} size="h4">Recent Orders</Title>
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tableData.orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td>{order.id.slice(0, 8)}...</td>
                  <td>${order.amount}</td>
                  <td><Badge color={order.status === 'completed' ? 'green' : 'yellow'}>{order.status}</Badge></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
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
    </Container>
  )
} 