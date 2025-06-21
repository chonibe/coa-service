"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { 
  AlertCircle, 
  ImagePlus, 
  Loader2, 
  Save 
} from 'lucide-react'

// Validation schema
const ProductEditSchema = z.object({
  vendorId: z.string().uuid(),
  lineItemId: z.string().uuid(),
  artistBio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  artworkStory: z.string().max(1000, "Artwork story must be 1000 characters or less").optional(),
  artworkMediaUrls: z.array(z.string().url()).max(3, "Maximum 3 media URLs allowed").optional()
})

type ProductEditFormData = z.infer<typeof ProductEditSchema>

export default function ProductEditPage({ 
  params 
}: { 
  params: { productId: string } 
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [productDetails, setProductDetails] = useState<any>(null)

  const { 
    control, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(ProductEditSchema),
    defaultValues: {
      artistBio: '',
      artworkStory: '',
      artworkMediaUrls: []
    }
  })

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`/api/vendor/products/${params.productId}`)
        const data = await response.json()
        
        if (data.success) {
          setProductDetails(data.product)
          setValue('artistBio', data.product.artistBio || '')
          setValue('artworkStory', data.product.artworkStory || '')
          setValue('artworkMediaUrls', data.product.artworkMediaUrls || [])
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to load product details",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Unable to fetch product details",
          variant: "destructive"
        })
      }
    }

    fetchProductDetails()
  }, [params.productId])

  // Submit handler
  const onSubmit = async (formData: ProductEditFormData) => {
    setIsLoading(true)
    
    try {
      // Update artist bio
      if (formData.artistBio) {
        const bioResponse = await fetch('/api/vendor/update-bio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: productDetails.vendorId,
            bio: formData.artistBio
          })
        })
        const bioResult = await bioResponse.json()
        
        if (!bioResult.success) {
          throw new Error(bioResult.message)
        }
      }

      // Update artwork story
      if (formData.artworkStory) {
        const storyResponse = await fetch('/api/vendor/update-artwork-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineItemId: params.productId,
            story: formData.artworkStory,
            mediaUrls: formData.artworkMediaUrls || []
          })
        })
        const storyResult = await storyResponse.json()
        
        if (!storyResult.success) {
          throw new Error(storyResult.message)
        }
      }

      toast({
        title: "Success",
        description: "Product details updated successfully",
        variant: "default"
      })

      router.push('/vendor/dashboard/products')
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Media URL input handler
  const handleMediaUrlChange = (index: number, value: string) => {
    const currentUrls = control.getValues('artworkMediaUrls') || []
    const newUrls = [...currentUrls]
    newUrls[index] = value
    setValue('artworkMediaUrls', newUrls)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product Details</CardTitle>
          <CardDescription>
            Update your artwork's story and artist information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Artist Bio Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Artist Bio</h3>
              <Controller
                name="artistBio"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Tell us about your artistic journey..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                )}
              />
              {errors.artistBio && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.artistBio.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {control.getValues('artistBio')?.length || 0}/500 characters
              </p>
            </div>

            {/* Artwork Story Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Artwork Story</h3>
              <Controller
                name="artworkStory"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Share the inspiration behind this artwork..."
                    className="min-h-[150px]"
                    maxLength={1000}
                  />
                )}
              />
              {errors.artworkStory && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.artworkStory.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {control.getValues('artworkStory')?.length || 0}/1000 characters
              </p>
            </div>

            {/* Media URLs Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Supporting Media</h3>
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <ImagePlus className="text-muted-foreground" />
                  <Controller
                    name={`artworkMediaUrls.${index}` as const}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="url"
                        placeholder={`Media URL ${index + 1}`}
                        value={field.value || ''}
                        onChange={(e) => handleMediaUrlChange(index, e.target.value)}
                      />
                    )}
                  />
                </div>
              ))}
              {errors.artworkMediaUrls && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.artworkMediaUrls.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 