"use client"

import { Container, Title, Text, Paper, Button, Code } from "@mantine/core"
import { useEffect, useState } from "react"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export default function TestConnection() {
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      setError(null)
      setTestResult(null)

      // Test regular client
      const { data: publicData, error: publicError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (publicError) throw publicError

      // Test admin client
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      if (adminError) throw adminError

      setTestResult({
        publicClient: publicData,
        adminClient: adminData,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' : null,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***' : null
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Test Supabase Connection</Title>
      
      <Paper p="md" radius="md" withBorder mb="xl">
        <Button onClick={testConnection} mb="md">
          Test Connection
        </Button>

        {error && (
          <Text c="red" mb="md">
            Error: {error}
          </Text>
        )}

        {testResult && (
          <Code block>
            {JSON.stringify(testResult, null, 2)}
          </Code>
        )}
      </Paper>
    </Container>
  )
} 