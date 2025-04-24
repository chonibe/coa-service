"use client"

import { Container, Title, Text, Paper, Group, Switch, TextInput, Button, Divider, Box } from "@mantine/core"
import { IconMail, IconLock, IconBell } from "@tabler/icons-react"

export default function Settings() {
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Settings</Title>

      <Box className="flex flex-col gap-8">
        <Paper p="md" radius="md" withBorder>
          <Title order={2} size="h3" mb="md">Account Settings</Title>
          <Box className="flex flex-col gap-4">
            <TextInput
              label="Email"
              placeholder="your@email.com"
              leftSection={<IconMail size={16} />}
            />
            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••"
              leftSection={<IconLock size={16} />}
            />
            <Group justify="flex-end">
              <Button>Save Changes</Button>
            </Group>
          </Box>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={2} size="h3" mb="md">Notification Settings</Title>
          <Box className="flex flex-col gap-4">
            <Group justify="space-between">
              <Group gap="xs">
                <IconBell size={16} />
                <Text>Email Notifications</Text>
              </Group>
              <Switch />
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <IconBell size={16} />
                <Text>Certificate Expiry Alerts</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <IconBell size={16} />
                <Text>System Updates</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
          </Box>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={2} size="h3" mb="md">System Settings</Title>
          <Box className="flex flex-col gap-4">
            <Group justify="space-between">
              <Text>Maintenance Mode</Text>
              <Switch />
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text>Enable Two-Factor Authentication</Text>
              <Switch />
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text>Auto-backup Database</Text>
              <Switch defaultChecked />
            </Group>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 