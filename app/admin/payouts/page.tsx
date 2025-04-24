"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Modal, Badge, NumberInput } from "@mantine/core"
import { IconSearch, IconPlus, IconEdit, IconEye, IconCurrencyDollar, IconCheck, IconX } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useDisclosure } from "@mantine/hooks"

interface Payout {
  id: string
  vendor_id: string
  vendor: {
    name: string
    email: string
  }
  amount: number
  status: string
  created_at: string
  processed_at?: string
  metadata: any
}

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          vendor:users(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayouts(data || [])
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayout = async (payoutId: string) => {
    try {
      setProcessing(true)
      const { error } = await supabase
        .from('payouts')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', payoutId)

      if (error) throw error
      await fetchPayouts()
    } catch (error) {
      console.error('Failed to process payout:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleCreatePayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('payouts')
        .insert([
          {
            vendor_id: user.id,
            amount: 0,
            status: 'pending',
            metadata: {}
          }
        ])
        .select()
        .single()

      if (error) throw error
      await fetchPayouts()
    } catch (error) {
      console.error('Failed to create payout:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.vendor?.name?.toLowerCase().includes(search.toLowerCase()) ||
                         payout.vendor?.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || payout.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Vendor Payouts</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreatePayout}>
          Create Payout
        </Button>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Box className="flex flex-col">
          <Group grow>
            <TextInput
              placeholder="Search payouts..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { value: 'processed', label: 'Processed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </Group>
        </Box>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Payout ID</th>
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
            ) : filteredPayouts.length === 0 ? (
              <tr>
                <td colSpan={6} align="center">
                  <Text>No payouts found</Text>
                </td>
              </tr>
            ) : (
              filteredPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.id}</td>
                  <td>{payout.vendor?.name || payout.vendor?.email}</td>
                  <td>
                    <Group gap="xs">
                      <IconCurrencyDollar size={14} />
                      <Text>{payout.amount.toFixed(2)}</Text>
                    </Group>
                  </td>
                  <td>
                    <Badge color={getStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                  </td>
                  <td>{new Date(payout.created_at).toLocaleDateString()}</td>
                  <td>
                    <Group gap="xs">
                      <Button 
                        variant="subtle" 
                        size="xs"
                        leftSection={<IconEye size={14} />}
                        onClick={() => {
                          setSelectedPayout(payout)
                          open()
                        }}
                      >
                        View
                      </Button>
                      {payout.status === 'pending' && (
                        <Button 
                          variant="subtle" 
                          size="xs"
                          color="green"
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleProcessPayout(payout.id)}
                          loading={processing}
                        >
                          Process
                        </Button>
                      )}
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
        title="Payout Details"
        size="lg"
      >
        {selectedPayout && (
          <Box>
            <Text size="sm" fw={500}>Payout ID</Text>
            <Text mb="md">{selectedPayout.id}</Text>
            
            <Text size="sm" fw={500}>Vendor</Text>
            <Text mb="md">{selectedPayout.vendor?.name || selectedPayout.vendor?.email}</Text>
            
            <Text size="sm" fw={500}>Amount</Text>
            <Text mb="md">${selectedPayout.amount.toFixed(2)}</Text>
            
            <Text size="sm" fw={500}>Status</Text>
            <Badge color={getStatusColor(selectedPayout.status)} mb="md">
              {selectedPayout.status}
            </Badge>
            
            <Text size="sm" fw={500}>Created</Text>
            <Text mb="md">{new Date(selectedPayout.created_at).toLocaleString()}</Text>
            
            {selectedPayout.processed_at && (
              <>
                <Text size="sm" fw={500}>Processed</Text>
                <Text mb="md">{new Date(selectedPayout.processed_at).toLocaleString()}</Text>
              </>
            )}
            
            <Text size="sm" fw={500}>Metadata</Text>
            <Text mb="md">
              <pre>{JSON.stringify(selectedPayout.metadata, null, 2)}</pre>
            </Text>
          </Box>
        )}
      </Modal>
    </Container>
  )
} 