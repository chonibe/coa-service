"use client"

import { Container, Title, Text, Paper, Table, Group, Button, TextInput, Select, Box, Badge, Stack, Modal, ActionIcon, Grid, Card } from "@mantine/core"
import { IconSearch, IconEye, IconEdit, IconTrash, IconPlus, IconRefresh, IconTag, IconDots, IconCurrencyDollar } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useDisclosure } from "@mantine/hooks"

interface Product {
  id: string
  name: string
  description: string
  price: number
  status: string
  vendor_id: string
  vendor: {
    name: string
    email: string
  }
  created_at: string
  updated_at: string
  metadata: any
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [syncLoading, setSyncLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [search, statusFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor:users!vendor_id(name, email)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,vendor.name.ilike.%${search}%`)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncLoading(true)
      // Here you would typically call your sync API
      // For now, we'll just simulate a sync
      await new Promise(resolve => setTimeout(resolve, 2000))
      fetchProducts()
    } catch (error) {
      console.error('Failed to sync products:', error)
    } finally {
      setSyncLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'inactive':
        return 'red'
      case 'draft':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Products</Title>
        <Group>
          <Button 
            leftSection={<IconRefresh size={16} />}
            onClick={handleSync}
            loading={syncLoading}
          >
            Sync Products
          </Button>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setSelectedProduct(null)
              open()
            }}
          >
            New Product
          </Button>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group>
          <TextInput
            placeholder="Search products..."
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
              { value: 'inactive', label: 'Inactive' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} align="center">
                  <Text>Loading...</Text>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} align="center">
                  <Text>No products found</Text>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>
                    <Text lineClamp={2}>{product.description}</Text>
                  </td>
                  <td>
                    <Group gap="xs">
                      <IconCurrencyDollar size={14} />
                      <Text>{product.price.toFixed(2)}</Text>
                    </Group>
                  </td>
                  <td>
                    <Stack gap={0}>
                      <Text>{product.vendor?.name}</Text>
                      <Text size="sm" c="dimmed">{product.vendor?.email}</Text>
                    </Stack>
                  </td>
                  <td>
                    <Badge color={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </td>
                  <td>{new Date(product.created_at).toLocaleString()}</td>
                  <td>
                    <Group gap="xs">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedProduct(product)
                          open()
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => {
                          setSelectedProduct(product)
                          open()
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="subtle" 
                        color="red"
                        onClick={() => handleDelete(product.id)}
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
        title={selectedProduct ? "Edit Product" : "New Product"}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Product name"
            value={selectedProduct?.name || ''}
          />
          <TextInput
            label="Description"
            placeholder="Product description"
            value={selectedProduct?.description || ''}
          />
          <TextInput
            label="Price"
            type="number"
            placeholder="0.00"
            value={selectedProduct?.price || ''}
          />
          <Select
            label="Status"
            value={selectedProduct?.status || 'draft'}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button>
              {selectedProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
} 