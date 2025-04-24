"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Badge, Stack, Modal, ActionIcon } from "@mantine/core"
import { IconSearch, IconEye, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useDisclosure } from "@mantine/hooks"

interface Certificate {
  id: string
  owner_id: string
  vendor_id: string
  status: string
  metadata: any
  created_at: string
  updated_at: string
  owner: {
    name: string
    email: string
  }
  vendor: {
    name: string
    email: string
  }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    fetchCertificates()
  }, [search, statusFilter])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('certificates')
        .select(`
          *,
          owner:users!owner_id(name, email),
          vendor:users!vendor_id(name, email)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`owner.name.ilike.%${search}%,owner.email.ilike.%${search}%,vendor.name.ilike.%${search}%`)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCertificates()
    } catch (error) {
      console.error('Failed to delete certificate:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'expired':
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
        <Title order={1}>Certificates</Title>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setSelectedCertificate(null)
            open()
          }}
        >
          New Certificate
        </Button>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Search certificates..."
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
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} align="center">
                  <Text>Loading...</Text>
                </td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={5} align="center">
                  <Text>No certificates found</Text>
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td>
                    <Stack gap={0}>
                      <Text>{certificate.owner?.name}</Text>
                      <Text size="sm" c="dimmed">{certificate.owner?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Stack gap={0}>
                      <Text>{certificate.vendor?.name}</Text>
                      <Text size="sm" c="dimmed">{certificate.vendor?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Badge color={getStatusColor(certificate.status)}>
                      {certificate.status}
                    </Badge>
                  </td>
                  <td>{new Date(certificate.created_at).toLocaleString()}</td>
                  <td>
                    <Group gap="xs">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedCertificate(certificate)
                          open()
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedCertificate(certificate)
                          open()
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="red"
                        onClick={() => handleDelete(certificate.id)}
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
        title={selectedCertificate ? "Edit Certificate" : "New Certificate"}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Owner Email"
            placeholder="owner@example.com"
            value={selectedCertificate?.owner?.email || ''}
          />
          <TextInput
            label="Vendor Email"
            placeholder="vendor@example.com"
            value={selectedCertificate?.vendor?.email || ''}
          />
          <Select
            label="Status"
            value={selectedCertificate?.status || 'pending'}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button>
              {selectedCertificate ? 'Save Changes' : 'Create Certificate'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
} 