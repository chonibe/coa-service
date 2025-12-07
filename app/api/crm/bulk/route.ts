import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Errors } from "@/lib/crm/errors"
import { parseFilter, parseFilterAsync, hasPathFilters } from "@/lib/crm/filter-parser"

/**
 * Bulk Operations API
 * Perform operations on multiple records at once
 */

type BulkOperation = 
  | "update" 
  | "delete" 
  | "archive" 
  | "restore" 
  | "add_tags" 
  | "remove_tags" 
  | "assign"

async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("crm_workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.workspace_id
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized("Authentication required"), { status: 401 })
    }

    const body = await request.json()
    const {
      entity_type,
      operation,
      record_ids,
      filters,
      data: operationData,
    } = body

    // Validation
    if (!entity_type || !operation) {
      return NextResponse.json(
        Errors.validation("entity_type and operation are required", { 
          field: !entity_type ? "entity_type" : "operation" 
        }),
        { status: 400 }
      )
    }

    const validEntityTypes = ['person', 'company', 'conversation', 'activity']
    if (!validEntityTypes.includes(entity_type)) {
      return NextResponse.json(
        Errors.validation(`entity_type must be one of: ${validEntityTypes.join(', ')}`, { 
          field: "entity_type" 
        }),
        { status: 400 }
      )
    }

    const validOperations: BulkOperation[] = [
      'update', 'delete', 'archive', 'restore', 
      'add_tags', 'remove_tags', 'assign'
    ]
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        Errors.validation(`operation must be one of: ${validOperations.join(', ')}`, { 
          field: "operation" 
        }),
        { status: 400 }
      )
    }

    // Must provide either record_ids or filters
    if (!record_ids && !filters) {
      return NextResponse.json(
        Errors.validation("Either record_ids or filters must be provided", { 
          field: "record_ids" 
        }),
        { status: 400 }
      )
    }

    // Get records to operate on
    let recordIds: string[] = []

    if (record_ids && Array.isArray(record_ids)) {
      recordIds = record_ids
    } else if (filters) {
      // Apply filters to get matching record IDs
      const tableName = entity_type === 'person' ? 'crm_customers' 
        : entity_type === 'company' ? 'crm_companies'
        : entity_type === 'conversation' ? 'crm_conversations'
        : 'crm_activities'

      let query = supabase
        .from(tableName)
        .select("id")

      // Apply filters
      if (hasPathFilters(filters)) {
        query = await parseFilterAsync(filters, query, supabase)
      } else {
        query = parseFilter(filters, query)
      }

      const { data: records, error: queryError } = await query.limit(10000) // Max 10k records

      if (queryError) {
        return NextResponse.json(
          Errors.invalidFilter(queryError.message || "Failed to apply filters", { field: "filters" }),
          { status: 400 }
        )
      }

      recordIds = (records || []).map((r: any) => r.id)
    }

    if (recordIds.length === 0) {
      return NextResponse.json({
        success: true,
        affected_count: 0,
        errors: [],
      })
    }

    // Limit to 1000 records per operation
    if (recordIds.length > 1000) {
      return NextResponse.json(
        Errors.validation("Cannot operate on more than 1000 records at once", { 
          field: "record_ids",
          reason: `Found ${recordIds.length} records, maximum is 1000`
        }),
        { status: 400 }
      )
    }

    // Perform bulk operation
    const errors: Array<{ record_id: string; error: string }> = []
    let affectedCount = 0

    const tableName = entity_type === 'person' ? 'crm_customers' 
      : entity_type === 'company' ? 'crm_companies'
      : entity_type === 'conversation' ? 'crm_conversations'
      : 'crm_activities'

    switch (operation) {
      case 'delete':
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .in('id', recordIds)

        if (deleteError) {
          return NextResponse.json(
            Errors.internal(deleteError.message || "Failed to delete records"),
            { status: 500 }
          )
        }
        affectedCount = recordIds.length
        break

      case 'archive':
        const { error: archiveError } = await supabase
          .from(tableName)
          .update({ is_archived: true })
          .in('id', recordIds)

        if (archiveError) {
          return NextResponse.json(
            Errors.internal(archiveError.message || "Failed to archive records"),
            { status: 500 }
          )
        }
        affectedCount = recordIds.length
        break

      case 'restore':
        const { error: restoreError } = await supabase
          .from(tableName)
          .update({ is_archived: false })
          .in('id', recordIds)

        if (restoreError) {
          return NextResponse.json(
            Errors.internal(restoreError.message || "Failed to restore records"),
            { status: 500 }
          )
        }
        affectedCount = recordIds.length
        break

      case 'update':
        if (!operationData || typeof operationData !== 'object') {
          return NextResponse.json(
            Errors.validation("data field is required for update operation", { field: "data" }),
            { status: 400 }
          )
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update(operationData)
          .in('id', recordIds)

        if (updateError) {
          return NextResponse.json(
            Errors.internal(updateError.message || "Failed to update records"),
            { status: 500 }
          )
        }
        affectedCount = recordIds.length
        break

      case 'add_tags':
      case 'remove_tags':
        if (!operationData?.tags || !Array.isArray(operationData.tags)) {
          return NextResponse.json(
            Errors.validation("data.tags array is required for tag operations", { field: "data.tags" }),
            { status: 400 }
          )
        }

        // For each record, update tags array
        for (const recordId of recordIds) {
          const { data: record, error: fetchError } = await supabase
            .from(tableName)
            .select("tags")
            .eq("id", recordId)
            .single()

          if (fetchError || !record) {
            errors.push({ record_id: recordId, error: "Record not found" })
            continue
          }

          const currentTags = (record.tags || []) as string[]
          let newTags: string[]

          if (operation === 'add_tags') {
            // Add tags, avoiding duplicates
            newTags = [...new Set([...currentTags, ...operationData.tags])]
          } else {
            // Remove tags
            newTags = currentTags.filter(tag => !operationData.tags.includes(tag))
          }

          const { error: tagError } = await supabase
            .from(tableName)
            .update({ tags: newTags })
            .eq("id", recordId)

          if (tagError) {
            errors.push({ record_id: recordId, error: tagError.message })
          } else {
            affectedCount++
          }
        }
        break

      case 'assign':
        if (!operationData?.assigned_to) {
          return NextResponse.json(
            Errors.validation("data.assigned_to is required for assign operation", { field: "data.assigned_to" }),
            { status: 400 }
          )
        }

        const { error: assignError } = await supabase
          .from(tableName)
          .update({ assigned_to: operationData.assigned_to })
          .in('id', recordIds)

        if (assignError) {
          return NextResponse.json(
            Errors.internal(assignError.message || "Failed to assign records"),
            { status: 500 }
          )
        }
        affectedCount = recordIds.length
        break

      default:
        return NextResponse.json(
          Errors.validation(`Unsupported operation: ${operation}`, { field: "operation" }),
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      affected_count: affectedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("[CRM] Error performing bulk operation:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to perform bulk operation"), { status: 500 })
  }
}




