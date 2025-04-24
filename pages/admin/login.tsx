"use client"

import type React from "react"

import { useState } from "react"
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import Head from "next/head"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Login successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        router.push("/admin/certificates/management")
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid password",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login - Collector Benefits System</title>
      </Head>

      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <Heading>Admin Login</Heading>

          <Box w="100%" p={8} borderWidth="1px" borderRadius="lg" boxShadow="md">
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  mt={4}
                  isLoading={isLoading}
                  loadingText="Logging in"
                >
                  Login
                </Button>
              </VStack>
            </form>
          </Box>

          <Text color="gray.500" fontSize="sm">
            Collector Benefits System - Admin Portal
          </Text>
        </VStack>
      </Container>
    </>
  )
}
