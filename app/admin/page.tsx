"use client"

import { Container, Title, Text, Paper, Grid, Card, Stack, Group } from "@mantine/core"
import { IconUsers, IconFileCertificate, IconCurrencyDollar, IconReceipt } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabaseAdmin } from "@/lib/supabase"

interface AdminStats {
  totalUsers: number
  totalCertificates: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCertificates: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch certificates count
      const { count: certificatesCount } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })

      // Fetch orders and calculate revenue
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('amount')

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.amount, 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalCertificates: certificatesCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Admin Dashboard</Title>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Users</Text>
              <Group gap="xs">
                <IconUsers size={24} />
                <Title order={3}>{stats.totalUsers}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Certificates</Text>
              <Group gap="xs">
                <IconFileCertificate size={24} />
                <Title order={3}>{stats.totalCertificates}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Total Orders</Text>
              <Group gap="xs">
                <IconReceipt size={24} />
                <Title order={3}>{stats.totalOrders}</Title>
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
                <Title order={3}>${stats.totalRevenue.toFixed(2)}</Title>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  )
} 