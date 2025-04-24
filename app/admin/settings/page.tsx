"use client"

import { Container, Title, Text, Paper, Stack, TextInput, Button, Switch, Group, Divider } from "@mantine/core"
import { IconDeviceFloppy } from "@tabler/icons-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface Settings {
  site_name: string
  site_description: string
  contact_email: string
  enable_registration: boolean
  enable_vendor_registration: boolean
  maintenance_mode: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_name: '',
    site_description: '',
    contact_email: '',
    enable_registration: true,
    enable_vendor_registration: true,
    maintenance_mode: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('settings')
        .upsert(settings)

      if (error) throw error
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack>
        <Title order={1}>Settings</Title>
        <Paper p="md" radius="md" withBorder>
          <Stack>
            <TextInput
              label="Site Name"
              placeholder="My Site"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            />
            <TextInput
              label="Site Description"
              placeholder="A brief description of your site"
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
            />
            <TextInput
              label="Contact Email"
              placeholder="contact@example.com"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Stack>
            <Title order={2} size="h4">Registration Settings</Title>
            <Switch
              label="Enable User Registration"
              checked={settings.enable_registration}
              onChange={(e) => setSettings({ ...settings, enable_registration: e.currentTarget.checked })}
            />
            <Switch
              label="Enable Vendor Registration"
              checked={settings.enable_vendor_registration}
              onChange={(e) => setSettings({ ...settings, enable_vendor_registration: e.currentTarget.checked })}
            />
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Stack>
            <Title order={2} size="h4">System Settings</Title>
            <Switch
              label="Maintenance Mode"
              checked={settings.maintenance_mode}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.currentTarget.checked })}
            />
          </Stack>
        </Paper>

        <Group justify="flex-end">
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={loading}
          >
            Save Settings
          </Button>
        </Group>
      </Stack>
    </Container>
  )
} 