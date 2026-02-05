import { createClient } from "@/lib/supabase/server"

/**
 * Initialize default experience blocks for a product
 * Creates a basic set of content blocks that vendors can customize
 */
export async function initializeDefaultExperience(
  productId: string,
  vendorName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Check if product already has blocks
    const { data: existingBlocks, error: checkError } = await supabase
      .from("product_benefits")
      .select("id")
      .eq("product_id", productId)
      .limit(1)

    if (checkError) {
      console.error(`[Initialize Experience] Error checking existing blocks:`, checkError)
      return { success: false, error: checkError.message }
    }

    // If blocks already exist, don't create defaults
    if (existingBlocks && existingBlocks.length > 0) {
      console.log(`[Initialize Experience] Product ${productId} already has blocks, skipping`)
      return { success: true }
    }

    // Get benefit type IDs for default blocks
    const { data: benefitTypes, error: typesError } = await supabase
      .from("benefit_types")
      .select("id, name")
      .in("name", [
        "Artwork Artist Note Block",
        "Artwork Process Gallery Block",
        "Artwork Inspiration Block",
      ])

    if (typesError || !benefitTypes) {
      console.error(`[Initialize Experience] Error fetching benefit types:`, typesError)
      return { success: false, error: typesError?.message || "Failed to fetch benefit types" }
    }

    // Create a map of benefit type names to IDs
    const typeMap = new Map(benefitTypes.map(bt => [bt.name, bt.id]))

    // Define default blocks with empty configurations
    const defaultBlocks = [
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap.get("Artwork Artist Note Block"),
        title: "Artist's Note",
        description: "Share your thoughts, inspiration, and story behind this artwork",
        block_config: {
          note_text: "",
          voice_note_url: null,
        },
        display_order: 1,
        is_published: true,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap.get("Artwork Process Gallery Block"),
        title: "Behind the Scenes",
        description: "Show collectors your creative process and how this artwork came to life",
        block_config: {
          images: [],
        },
        display_order: 2,
        is_published: true,
        is_active: true,
      },
      {
        product_id: productId,
        vendor_name: vendorName,
        benefit_type_id: typeMap.get("Artwork Inspiration Block"),
        title: "Inspiration Board",
        description: "Share the references, mood, and inspiration that influenced this piece",
        block_config: {
          images: [],
        },
        display_order: 3,
        is_published: true,
        is_active: true,
      },
    ]

    // Insert default blocks
    const { error: insertError } = await supabase
      .from("product_benefits")
      .insert(defaultBlocks)

    if (insertError) {
      console.error(`[Initialize Experience] Error inserting default blocks:`, insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`[Initialize Experience] Successfully created default blocks for product ${productId}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Initialize Experience] Unexpected error:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Initialize default experience for a submission
 * Uses the submission ID as the product ID
 */
export async function initializeSubmissionExperience(
  submissionId: string,
  vendorName: string
): Promise<{ success: boolean; error?: string }> {
  return initializeDefaultExperience(submissionId, vendorName)
}
