"use client"

import { SelectContent } from "@/components/ui/select"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Heading,
  Text,
  Switch,
  HStack,
  VStack,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
} from "@/components/ui/chakra"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignEditions: true,
    editionFormat: "number",
    updateShopify: true,
    syncOnWebhook: true,
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to your backend
    console.log("Saving settings:", settings)
    // Show a toast or notification
  }

  return (
    <Box className="container mx-auto py-10 max-w-5xl">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" fontWeight="bold" tracking="tight">
            Settings
          </Heading>
          <Text color="gray.500" mt={2}>
            Configure your edition numbering system
          </Text>
        </Box>

        <HStack spacing={4} width="100%">
          <Card flex="1">
            <CardHeader>
              <Heading as="h2" size="lg">
                Edition Numbering
              </Heading>
              <Text color="gray.500">Configure how edition numbers are assigned and displayed</Text>
            </CardHeader>
            <CardContent>
              <VStack spacing={4} align="start">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="auto-assign" fontWeight="semibold">
                      Auto-assign edition numbers
                    </FormLabel>
                    <FormHelperText color="gray.500">Automatically assign edition numbers to new orders</FormHelperText>
                  </Box>
                  <Switch
                    id="auto-assign"
                    isChecked={settings.autoAssignEditions}
                    onChange={(e) => setSettings({ ...settings, autoAssignEditions: e.target.checked })}
                  />
                </FormControl>
                <Divider />

                <FormControl>
                  <FormLabel htmlFor="edition-format" fontWeight="semibold">
                    Edition number format
                  </FormLabel>
                  <Select
                    id="edition-format"
                    value={settings.editionFormat}
                    onChange={(e) => setSettings({ ...settings, editionFormat: e.target.value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number only (e.g., 42)</SelectItem>
                      <SelectItem value="number-of-total">Number of total (e.g., 42/100)</SelectItem>
                      <SelectItem value="custom">Custom format</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormHelperText color="gray.500">
                    How edition numbers should be formatted when displayed
                  </FormHelperText>
                </FormControl>
              </VStack>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} leftIcon={<Save />}>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </HStack>

        <HStack spacing={4} width="100%">
          <Card flex="1">
            <CardHeader>
              <Heading as="h2" size="lg">
                Advanced Settings
              </Heading>
              <Text color="gray.500">Configure advanced options for the edition numbering system</Text>
            </CardHeader>
            <CardContent>
              <VStack spacing={4} align="start">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="update-shopify" fontWeight="semibold">
                      Update Shopify line items
                    </FormLabel>
                    <FormHelperText color="gray.500">
                      Update Shopify line item properties with edition numbers
                    </FormHelperText>
                  </Box>
                  <Switch
                    id="update-shopify"
                    isChecked={settings.updateShopify}
                    onChange={(e) => setSettings({ ...settings, updateShopify: e.target.checked })}
                  />
                </FormControl>
                <Divider />

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="sync-webhook" fontWeight="semibold">
                      Sync on webhook
                    </FormLabel>
                    <Text color="gray.500">Process edition numbers when order webhooks are received</Text>
                  </Box>
                  <Switch
                    id="sync-webhook"
                    isChecked={settings.syncOnWebhook}
                    onChange={(e) => setSettings({ ...settings, syncOnWebhook: e.target.checked })}
                  />
                </FormControl>
              </VStack>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} leftIcon={<Save />}>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </HStack>
      </VStack>
    </Box>
  )
}
