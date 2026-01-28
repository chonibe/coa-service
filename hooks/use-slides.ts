"use client"

import { useState, useEffect, useCallback } from "react"
import type { Slide, CreateSlideInput, UpdateSlideInput } from "@/lib/slides/types"

interface UseSlidesOptions {
  productId: string
  /** Use vendor API (for editing) vs collector API (for viewing) */
  mode: "vendor" | "collector"
}

interface UseSlidesResult {
  slides: Slide[]
  product: { id: string; name: string; vendor_name?: string } | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createSlide: (input?: CreateSlideInput) => Promise<Slide | null>
  updateSlide: (slideId: string, input: UpdateSlideInput) => Promise<Slide | null>
  deleteSlide: (slideId: string) => Promise<boolean>
  reorderSlides: (slideOrder: string[]) => Promise<boolean>
}

/**
 * Hook for fetching and managing slides
 * 
 * Use mode="vendor" for the slide editor (requires auth)
 * Use mode="collector" for the collector view (public)
 */
export function useSlides({ productId, mode }: UseSlidesOptions): UseSlidesResult {
  const [slides, setSlides] = useState<Slide[]>([])
  const [product, setProduct] = useState<{ id: string; name: string; vendor_name?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiBase = mode === "vendor" 
    ? `/api/vendor/slides/${productId}`
    : `/api/collector/slides/${productId}`

  const fetchSlides = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(apiBase, {
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch slides")
      }

      setSlides(data.slides || [])
      setProduct(data.product || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    if (productId) {
      fetchSlides()
    }
  }, [productId, fetchSlides])

  const createSlide = useCallback(async (input?: CreateSlideInput): Promise<Slide | null> => {
    if (mode !== "vendor") {
      console.error("Cannot create slides in collector mode")
      return null
    }

    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input || {}),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create slide")
      }

      const newSlide = data.slide
      setSlides(prev => [...prev, newSlide])
      return newSlide
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [apiBase, mode])

  const updateSlide = useCallback(async (slideId: string, input: UpdateSlideInput): Promise<Slide | null> => {
    if (mode !== "vendor") {
      console.error("Cannot update slides in collector mode")
      return null
    }

    try {
      const response = await fetch(`${apiBase}/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update slide")
      }

      const updatedSlide = data.slide
      setSlides(prev => prev.map(s => s.id === slideId ? updatedSlide : s))
      return updatedSlide
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [apiBase, mode])

  const deleteSlide = useCallback(async (slideId: string): Promise<boolean> => {
    if (mode !== "vendor") {
      console.error("Cannot delete slides in collector mode")
      return false
    }

    try {
      const response = await fetch(`${apiBase}/${slideId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete slide")
      }

      setSlides(prev => prev.filter(s => s.id !== slideId))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [apiBase, mode])

  const reorderSlides = useCallback(async (slideOrder: string[]): Promise<boolean> => {
    if (mode !== "vendor") {
      console.error("Cannot reorder slides in collector mode")
      return false
    }

    // Optimistic update
    const previousSlides = [...slides]
    const reorderedSlides = slideOrder.map(id => slides.find(s => s.id === id)).filter(Boolean) as Slide[]
    setSlides(reorderedSlides)

    try {
      const response = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slideOrder }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to reorder slides")
      }

      return true
    } catch (err: any) {
      setError(err.message)
      // Revert on error
      setSlides(previousSlides)
      return false
    }
  }, [apiBase, mode, slides])

  return {
    slides,
    product,
    isLoading,
    error,
    refetch: fetchSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
  }
}

export default useSlides
