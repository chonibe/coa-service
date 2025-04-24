"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Badge, Stack } from "@mantine/core"
import { IconSearch, IconFilter, IconClock, IconUser, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Log {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  user_id: string
  user: {
    name: string
    email: string
  }
  created_at: string
  metadata: any
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [search, typeFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('logs')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('message', `%${search}%`)
      }

      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'green'
      case 'warning':
        return 'yellow'
      case 'error':
        return 'red'
      default:
        return 'blue'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <IconAlertCircle size={16} />
      case 'error':
        return <IconAlertCircle size={16} />
      default:
        return <IconInfoCircle size={16} />
    }
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">System Logs</Title>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            value={typeFilter}
            onChange={setTypeFilter}
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
              { value: 'success', label: 'Success' },
            ]}
          />
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>User</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} align="center">
                  <Text>Loading...</Text>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} align="center">
                  <Text>No logs found</Text>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <Badge 
                      color={getTypeColor(log.type)}
                      leftSection={getTypeIcon(log.type)}
                    >
                      {log.type}
                    </Badge>
                  </td>
                  <td>
                    <Text>{log.message}</Text>
                    {log.metadata && (
                      <Text size="sm" c="dimmed">
                        {JSON.stringify(log.metadata)}
                      </Text>
                    )}
                  </td>
                  <td>
                    <Stack gap={0}>
                      <Text>{log.user?.name}</Text>
                      <Text size="sm" c="dimmed">{log.user?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Group gap="xs">
                      <IconClock size={14} />
                      <Text>{new Date(log.created_at).toLocaleString()}</Text>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Paper>
    </Container>
  )
} 