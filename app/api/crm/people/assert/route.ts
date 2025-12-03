import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Assert Person Endpoint
 * Creates or updates a person record based on unique attribute matching
 * Similar to Attio's assert pattern
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      email,
      phone,
      instagram_id,
      facebook_id,
      whatsapp_id,
      first_name,
      last_name,
      company_id,
      tags,
      notes,
      metadata,
      auto_create_company = true, // Default to true for Attio-like behavior
    } = body

    // Determine matching attribute (priority: email > phone > instagram_id > facebook_id > whatsapp_id)
    let matchingAttribute: string | null = null
    let matchingValue: string | null = null
    let existingPerson: any = null

    if (email) {
      matchingAttribute = "email"
      matchingValue = email
      const { data } = await supabase
        .from("crm_customers")
        .select("*")
        .eq("email", email)
        .single()
      if (data) existingPerson = data
    } else if (phone) {
      matchingAttribute = "phone"
      matchingValue = phone
      const { data } = await supabase
        .from("crm_customers")
        .select("*")
        .eq("phone", phone)
        .single()
      if (data) existingPerson = data
    } else if (instagram_id) {
      matchingAttribute = "instagram_id"
      matchingValue = instagram_id
      const { data } = await supabase
        .from("crm_customers")
        .select("*")
        .eq("instagram_id", instagram_id)
        .single()
      if (data) existingPerson = data
    } else if (facebook_id) {
      matchingAttribute = "facebook_id"
      matchingValue = facebook_id
      const { data } = await supabase
        .from("crm_customers")
        .select("*")
        .eq("facebook_id", facebook_id)
        .single()
      if (data) existingPerson = data
    } else if (whatsapp_id) {
      matchingAttribute = "whatsapp_id"
      matchingValue = whatsapp_id
      const { data } = await supabase
        .from("crm_customers")
        .select("*")
        .eq("whatsapp_id", whatsapp_id)
        .single()
      if (data) existingPerson = data
    }

    // Handle company matching/creation if email provided
    let finalCompanyId = company_id
    if (email && auto_create_company && !company_id) {
      const domain = email.split("@")[1]
      if (domain) {
        // Search for existing company by domain
        const { data: existingCompany } = await supabase
          .from("crm_companies")
          .select("id")
          .eq("domain", domain)
          .single()

        if (existingCompany) {
          finalCompanyId = existingCompany.id
        } else {
          // Create new company from domain
          const { data: newCompany, error: companyError } = await supabase
            .from("crm_companies")
            .insert({
              name: domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1), // Capitalize first part
              domain: domain,
            })
            .select()
            .single()

          if (!companyError && newCompany) {
            finalCompanyId = newCompany.id
          }
        }
      }
    }

    // Prepare update data (merge with existing, prefer new non-null values)
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name || null
    if (last_name !== undefined) updateData.last_name = last_name || null
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone || null
    if (instagram_id !== undefined) updateData.instagram_id = instagram_id || null
    if (facebook_id !== undefined) updateData.facebook_id = facebook_id || null
    if (whatsapp_id !== undefined) updateData.whatsapp_id = whatsapp_id || null
    if (finalCompanyId !== undefined) updateData.company_id = finalCompanyId || null
    if (notes !== undefined) updateData.notes = notes || null
    if (metadata !== undefined) updateData.metadata = metadata || null

    // Handle tags (merge arrays for multi-select behavior)
    if (tags !== undefined && Array.isArray(tags)) {
      if (existingPerson && existingPerson.tags) {
        // Merge tags, removing duplicates
        const mergedTags = [...new Set([...existingPerson.tags, ...tags])]
        updateData.tags = mergedTags
      } else {
        updateData.tags = tags
      }
    }

    if (existingPerson) {
      // Update existing person
      const { data, error } = await supabase
        .from("crm_customers")
        .update(updateData)
        .eq("id", existingPerson.id)
        .select(`
          *,
          crm_companies (
            id,
            name,
            domain
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Update contact identifiers if needed
      if (email || phone) {
        const identifiers = []
        if (email) {
          identifiers.push({
            customer_id: data.id,
            identifier_type: "email",
            identifier_value: email,
            is_primary: true,
          })
        }
        if (phone) {
          identifiers.push({
            customer_id: data.id,
            identifier_type: "phone",
            identifier_value: phone,
            is_primary: true,
          })
        }

        if (identifiers.length > 0) {
          // Upsert identifiers
          for (const identifier of identifiers) {
            await supabase
              .from("crm_contact_identifiers")
              .upsert(identifier, {
                onConflict: "customer_id,identifier_type",
              })
          }
        }
      }

      return NextResponse.json({
        person: data,
        created: false,
        matched_by: matchingAttribute,
      })
    } else {
      // Create new person
      if (!matchingAttribute) {
        return NextResponse.json(
          { error: "At least one unique identifier (email, phone, instagram_id, facebook_id, or whatsapp_id) is required" },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from("crm_customers")
        .insert({
          email,
          first_name,
          last_name,
          phone,
          instagram_id,
          facebook_id,
          whatsapp_id,
          company_id: finalCompanyId,
          tags: tags || [],
          notes,
          metadata: metadata || {},
        })
        .select(`
          *,
          crm_companies (
            id,
            name,
            domain
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Create contact identifiers
      if (email || phone) {
        const identifiers = []
        if (email) {
          identifiers.push({
            customer_id: data.id,
            identifier_type: "email",
            identifier_value: email,
            is_primary: true,
          })
        }
        if (phone) {
          identifiers.push({
            customer_id: data.id,
            identifier_type: "phone",
            identifier_value: phone,
            is_primary: true,
          })
        }

        if (identifiers.length > 0) {
          await supabase.from("crm_contact_identifiers").insert(identifiers)
        }
      }

      return NextResponse.json({
        person: data,
        created: true,
        matched_by: null,
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("[CRM] Error asserting person:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

