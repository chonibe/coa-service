"use client"

import * as React from "react"
import { useDisclosure } from "@mantine/hooks"
import { useMediaQuery } from "@mantine/hooks"
import {
  AppShell,
  Text,
  Button,
  Group,
  UnstyledButton,
  Box,
  Burger,
  ScrollArea,
  Divider,
  TextInput,
  Skeleton,
  Drawer,
} from "@mantine/core"
import { IconLayoutSidebar } from "@tabler/icons-react"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  isExpanded: boolean
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps {
  children: React.ReactNode
  defaultExpanded?: boolean
}

export function Sidebar({ children, defaultExpanded = true }: SidebarProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(defaultExpanded)
  const [opened, { toggle: toggleOpened }] = useDisclosure(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleExpanded()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [toggleExpanded])

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: expanded,
        isMobile,
        toggleSidebar: isMobile ? toggleOpened : toggleExpanded,
      }}
    >
      <AppShell
        navbar={{
          width: isMobile ? SIDEBAR_WIDTH_MOBILE : expanded ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
          breakpoint: "sm",
        }}
      >
        {isMobile ? (
          <Drawer
            opened={opened}
            onClose={toggleOpened}
            size={SIDEBAR_WIDTH_MOBILE}
            position="left"
            withCloseButton={false}
          >
            <ScrollArea h="calc(100vh - 60px)">
              {children}
            </ScrollArea>
          </Drawer>
        ) : (
          <Box
            w={expanded ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              backgroundColor: "var(--mantine-color-body)",
              borderRight: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            <Box p="md">
              <Group justify="space-between">
                {expanded && <Text size="lg" fw={500}>Menu</Text>}
                <Burger opened={expanded} onClick={toggleExpanded} />
              </Group>
            </Box>
            <ScrollArea h="calc(100vh - 60px)">
              {children}
            </ScrollArea>
          </Box>
        )}
        <Box
          style={{
            marginLeft: isMobile ? 0 : expanded ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
            transition: "margin-left 0.2s ease",
          }}
        >
          {children}
        </Box>
      </AppShell>
    </SidebarContext.Provider>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
}

export function SidebarItem({ icon, label, href, onClick }: SidebarItemProps) {
  const { isExpanded } = useSidebar()

  return (
    <UnstyledButton
      component={href ? "a" : "button"}
      href={href}
      onClick={onClick}
      styles={(theme) => ({
        root: {
          display: "block",
          width: "100%",
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color: theme.white,
          "&:hover": {
            backgroundColor: theme.colors.dark[6],
          },
        },
      })}
    >
      <Group>
        <Box w={24} h={24}>{icon}</Box>
        {isExpanded && <Text size="sm">{label}</Text>}
      </Group>
    </UnstyledButton>
  )
}
