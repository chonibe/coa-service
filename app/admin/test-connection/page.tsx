"use client"

import { Container, Title, Text, Paper, Button, Stack } from "@mantine/core"
import { IconTestPipe } from "@tabler/icons-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const testConnection = async () => {
    try {
      setLoading(true)
      setResult(null)

      const { data, error } = await supabase
        .from('users')
        .select('count')
        .single()

      if (error) throw error

      setResult({
        success: true,
        message: `Successfully connected to Supabase! Found ${data.count} users.`
      })
    } catch (error: any) {
      console.error('Connection test failed:', error)
      setResult({
        success: false,
        message: `Connection failed: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack>
        <Title order={1}>Test Connection</Title>
        <Paper p="md" radius="md" withBorder>
          <Stack>
            <Text>Click the button below to test the connection to Supabase.</Text>
            <Button
              leftSection={<IconTestPipe size={20} />}
              onClick={testConnection}
              loading={loading}
            >
              Test Connection
            </Button>
            {result && (
              <Paper
                p="md"
                radius="md"
                bg={result.success ? 'green.1' : 'red.1'}
              >
                <Text c={result.success ? 'green' : 'red'}>
                  {result.message}
                </Text>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
} 