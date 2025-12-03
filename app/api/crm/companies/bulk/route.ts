import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Bulk Operations API for Companies
 * Supports: update, tag, delete, add_to_list, remove_from_list
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { operation, record_ids, data } = body

    if (!operation || !record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
      return NextResponse.json(
        { error: "operation and record_ids (array) are required" },
        { status: 400 }
      )
    }

    let result: any = { updated: 0, errors: [] }

    switch (operation) {
      case "update":
        if (!data) {
          return NextResponse.json(
            { error: "data object is required for update operation" },
            { status: 400 }
          )
        }

        const { data: updated, error: updateError } = await supabase
          .from("crm_companies")
          .update(data)
          .in("id", record_ids)
          .select("id")

        if (updateError) throw updateError
        result.updated = updated?.length || 0
        break

      case "tag":
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: "data.tags (array) is required for tag operation" },
            { status: 400 }
          )
        }

        const { data: currentRecords } = await supabase
          .from("crm_companies")
          .select("id, tags")
          .in("id", record_ids)

        if (currentRecords) {
          for (const record of currentRecords) {
            const currentTags = record.tags || []
            const mergedTags = [...new Set([...currentTags, ...data.tags])]
            
            await supabase
              .from("crm_companies")
              .update({ tags: mergedTags })
              .eq("id", record.id)
          }
          result.updated = currentRecords.length
        }
        break

      case "delete":
        const { error: deleteError } = await supabase
          .from("crm_companies")
          .delete()
          .in("id", record_ids)

        if (deleteError) throw deleteError
        result.updated = record_ids.length
        break

      case "add_to_list":
        if (!data?.list_id) {
          return NextResponse.json(
            { error: "data.list_id is required for add_to_list operation" },
            { status: 400 }
          )
        }

        const { data: list } = await supabase
          .from("crm_lists")
          .select("object_type")
          .eq("id", data.list_id)
          .single()

        if (!list || list.object_type !== "company") {
          return NextResponse.json(
            { error: "List not found or not for company records" },
            { status: 400 }
          )
        }

        for (const recordId of record_ids) {
          await supabase
            .from("crm_list_entries")
            .upsert({
              list_id: data.list_id,
              record_id: recordId,
              record_type: "company",
            }, {
              onConflict: "list_id,record_id,record_type",
            })
        }
        result.updated = record_ids.length
        break

      case "remove_from_list":
        if (!data?.list_id) {
          return NextResponse.json(
            { error: "data.list_id is required for remove_from_list operation" },
            { status: 400 }
          )
        }

        const { error: removeError } = await supabase
          .from("crm_list_entries")
          .delete()
          .eq("list_id", data.list_id)
          .in("record_id", record_ids)
          .eq("record_type", "company")

        if (removeError) throw removeError
        result.updated = record_ids.length
        break

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[CRM] Error in bulk operation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

