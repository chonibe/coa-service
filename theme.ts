import { extendTheme } from "@chakra-ui/react"

export const theme = extendTheme({
  colors: {
    primary: {
      50: "#e6f2ff",
      100: "#cce5ff",
      200: "#99cbff",
      300: "#66b0ff",
      400: "#3396ff",
      500: "#007bff", // Primary color
      600: "#0062cc",
      700: "#004a99",
      800: "#003166",
      900: "#001933",
    },
  },
  fonts: {
    heading: "var(--font-sans)",
    body: "var(--font-sans)",
  },
  styles: {
    global: {
      body: {
        bg: "white",
        color: "gray.800",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "md",
      },
      variants: {
        solid: {
          bg: "primary.500",
          color: "white",
          _hover: {
            bg: "primary.600",
          },
        },
        outline: {
          border: "1px solid",
          borderColor: "primary.500",
          color: "primary.500",
        },
        ghost: {
          color: "primary.500",
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "md",
          boxShadow: "sm",
          overflow: "hidden",
        },
        header: {
          padding: 4,
        },
        body: {
          padding: 4,
        },
        footer: {
          padding: 4,
        },
      },
    },
  },
})

// Export a system theme for use in the provider
export const system = theme
