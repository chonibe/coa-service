"use client"

import type React from "react"

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Card,
  CardBody,
  Stack,
} from "@chakra-ui/react"
import { RefreshCw, MoreVertical, Check, X, BadgeIcon as Certificate } from "lucide-react"

interface OrderItem {
  id: string
  line_item_id: string
  product_id: string
  title: string
  quantity: number
  price: string
  total: string
  vendor: string
  image?: string
  imageAlt?: string
  tags: string[]
  fulfillable: boolean
  refunded: boolean
  restocked: boolean
  removed?: boolean
  inventory_quantity?: number
  is_limited_edition?: boolean
  total_inventory?: string
  rarity?: string
  commitment_number?: string
  status?: "active" | "removed"
  removed_reason?: string
  variant?: {
    position: number
  }
  order_info: {
    order_id: string
    order_number: string
    processed_at: string
    fulfillment_status: string
    financial_status: string
  }
  customAttributes?: any[]
  properties?: any[]
}

interface ItemCardProps {
  item: OrderItem
  formatMoney: (amount: string | number, currency?: string) => string
  formatStatus: (status: string) => string
  onRemoveClick: (item: OrderItem) => void
}

const ItemCard: React.FC<ItemCardProps> = ({ item, formatMoney, formatStatus, onRemoveClick }) => {
  return (
    <Card overflow="hidden" opacity={!item.fulfillable ? 0.8 : 1}>
      {/* Item image */}
      <Box position="relative" h="60">
        {!item.fulfillable && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%) rotate(-12deg)"
            bg="red.500"
            color="white"
            px={3}
            py={1}
            fontWeight="semibold"
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="wider"
            rounded="md"
            zIndex={10}
          >
            {item.refunded ? "Refunded" : item.restocked ? "Restocked" : "Not Fulfillable"}
          </Box>
        )}

        {/* Edition badge */}
        {/* Actions menu */}
        <Box position="absolute" top={2} right={2} zIndex={20}>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              h={8}
              w={8}
              minW={8}
              p={0}
              bg="white"
              opacity={0.8}
              _hover={{ bg: "white", opacity: 1 }}
            >
              <MoreVertical size={16} />
            </MenuButton>
            <MenuList>
              <MenuDivider />
              <MenuItem>
                <RefreshCw size={16} style={{ marginRight: "8px" }} />
                Refresh Edition Info
              </MenuItem>
              <MenuItem>
                <Certificate size={16} style={{ marginRight: "8px" }} />
                View Certificate
              </MenuItem>
              {item.status !== "removed" && (
                <MenuItem onClick={() => onRemoveClick(item)} color="red.500">
                  <X size={16} style={{ marginRight: "8px" }} />
                  Remove Item
                </MenuItem>
              )}
              {item.status === "removed" && (
                <MenuItem isDisabled color="gray.400" opacity={0.5} cursor="not-allowed">
                  <Check size={16} style={{ marginRight: "8px" }} />
                  Item Removed
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Box>

        {item.image ? (
          <Box
            as="img"
            src={item.image || "/placeholder.svg"}
            alt={item.imageAlt || item.title}
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : (
          <Flex w="full" h="full" alignItems="center" justifyContent="center" color="gray.400">
            <Box as="svg" width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path
                d="M21 15L16 10L5 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Box>
          </Flex>
        )}
      </Box>

      {/* Item content */}
      <CardBody p={4}>
        <Heading as="h3" size="md" fontWeight="semibold" mb={1} noOfLines={1}>
          {item.title}
        </Heading>
        <Flex alignItems="center" mb={4} fontSize="sm" color="gray.500">
          <Box w="1.5px" h="1.5px" rounded="full" bg="gray.500" mr="1.5px"></Box>
          {item.vendor}
        </Flex>

        <Stack spacing={2} fontSize="sm">
          <Flex justify="space-between">
            <Text color="gray.500">Price:</Text>
            <Text>{formatMoney(item.price)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="gray.500">Quantity:</Text>
            <Text>{item.quantity}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="gray.500">Total:</Text>
            <Text>{formatMoney(item.total)}</Text>
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  )
}
