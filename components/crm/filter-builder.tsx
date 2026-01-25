"use client"

import { useState } from "react"





import { X, Plus, Trash2 } from "lucide-react"

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Badge, Card, CardContent } from "@/components/ui"
type FilterOperator = 
  | "$eq" | "$ne" | "$contains" | "$starts_with" | "$ends_with"
  | "$not_empty" | "$empty" | "$gt" | "$gte" | "$lt" | "$lte" | "$in" | "$not_in"

type LogicalOperator = "$and" | "$or"

interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: string | number | string[] | null
}

interface FilterGroup {
  id: string
  logicalOperator: LogicalOperator
  conditions: FilterCondition[]
  groups: FilterGroup[]
}

interface FilterBuilderProps {
  entityType: "person" | "company" | "conversation" | "activity"
  filters: any // Attio filter object
  onFiltersChange: (filters: any) => void
}

const fieldOptions = {
  person: [
    { value: "email", label: "Email", type: "text" },
    { value: "first_name", label: "First Name", type: "text" },
    { value: "last_name", label: "Last Name", type: "text" },
    { value: "phone", label: "Phone", type: "text" },
    { value: "total_orders", label: "Total Orders", type: "number" },
    { value: "total_spent", label: "Total Spent", type: "number" },
    { value: "tags", label: "Tags", type: "array" },
    { value: "company_id", label: "Company", type: "reference" },
    { value: "last_order_date", label: "Last Order Date", type: "date" },
  ],
  company: [
    { value: "name", label: "Name", type: "text" },
    { value: "domain", label: "Domain", type: "text" },
    { value: "industry", label: "Industry", type: "text" },
    { value: "company_size", label: "Company Size", type: "text" },
    { value: "total_people", label: "Total People", type: "number" },
    { value: "total_orders", label: "Total Orders", type: "number" },
    { value: "tags", label: "Tags", type: "array" },
  ],
  conversation: [
    { value: "platform", label: "Platform", type: "text" },
    { value: "status", label: "Status", type: "text" },
    { value: "last_message_at", label: "Last Message", type: "date" },
  ],
  activity: [
    { value: "activity_type", label: "Activity Type", type: "text" },
    { value: "platform", label: "Platform", type: "text" },
    { value: "is_completed", label: "Completed", type: "boolean" },
    { value: "priority", label: "Priority", type: "text" },
    { value: "created_at", label: "Created At", type: "date" },
    { value: "due_date", label: "Due Date", type: "date" },
  ],
}

const operatorOptions: Array<{ value: FilterOperator; label: string; requiresValue: boolean }> = [
  { value: "$eq", label: "Equals", requiresValue: true },
  { value: "$ne", label: "Not Equals", requiresValue: true },
  { value: "$contains", label: "Contains", requiresValue: true },
  { value: "$starts_with", label: "Starts With", requiresValue: true },
  { value: "$ends_with", label: "Ends With", requiresValue: true },
  { value: "$not_empty", label: "Is Not Empty", requiresValue: false },
  { value: "$empty", label: "Is Empty", requiresValue: false },
  { value: "$gt", label: "Greater Than", requiresValue: true },
  { value: "$gte", label: "Greater Than or Equal", requiresValue: true },
  { value: "$lt", label: "Less Than", requiresValue: true },
  { value: "$lte", label: "Less Than or Equal", requiresValue: true },
  { value: "$in", label: "In (comma-separated)", requiresValue: true },
  { value: "$not_in", label: "Not In (comma-separated)", requiresValue: true },
]

export function FilterBuilder({ entityType, filters, onFiltersChange }: FilterBuilderProps) {
  const [rootGroup, setRootGroup] = useState<FilterGroup>(() => {
    // Parse existing filters into group structure
    if (filters && Object.keys(filters).length > 0) {
      return parseFilterToGroup(filters)
    }
    return {
      id: "root",
      logicalOperator: "$and",
      conditions: [],
      groups: [],
    }
  })

  function parseFilterToGroup(filter: any): FilterGroup {
    // If filter has $and or $or, it's a logical group
    if (filter.$and) {
      return {
        id: "root",
        logicalOperator: "$and",
        conditions: [],
        groups: filter.$and.map((f: any, idx: number) => parseFilterToGroup(f)),
      }
    }
    if (filter.$or) {
      return {
        id: "root",
        logicalOperator: "$or",
        conditions: [],
        groups: filter.$or.map((f: any, idx: number) => parseFilterToGroup(f)),
      }
    }

    // Otherwise, it's a set of field conditions
    const conditions: FilterCondition[] = []
    for (const [field, condition] of Object.entries(filter)) {
      if (field.startsWith("$")) continue

      if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {
        // Verbose syntax: { field: { $operator: value } }
        for (const [op, value] of Object.entries(condition)) {
          if (op.startsWith("$")) {
            conditions.push({
              id: `${field}-${op}-${Date.now()}`,
              field,
              operator: op as FilterOperator,
              value: value as any,
            })
          }
        }
      } else {
        // Shorthand: { field: value } means $eq
        conditions.push({
          id: `${field}-eq-${Date.now()}`,
          field,
          operator: "$eq",
          value: condition as any,
        })
      }
    }

    return {
      id: "root",
      logicalOperator: "$and",
      conditions,
      groups: [],
    }
  }

  function groupToFilter(group: FilterGroup): any {
    if (group.groups.length > 0) {
      // Has nested groups
      const groupFilters = group.groups.map(g => groupToFilter(g))
      return {
        [group.logicalOperator]: groupFilters,
      }
    }

    if (group.conditions.length === 0) {
      return {}
    }

    if (group.conditions.length === 1) {
      const cond = group.conditions[0]
      if (cond.operator === "$eq") {
        // Use shorthand
        return { [cond.field]: cond.value }
      }
      return {
        [cond.field]: {
          [cond.operator]: cond.value,
        },
      }
    }

    // Multiple conditions - use logical operator
    const conditions = group.conditions.map(cond => {
      if (cond.operator === "$eq") {
        return { [cond.field]: cond.value }
      }
      return {
        [cond.field]: {
          [cond.operator]: cond.value,
        },
      }
    })

    if (group.logicalOperator === "$and") {
      return {
        $and: conditions,
      }
    } else {
      return {
        $or: conditions,
      }
    }
  }

  const addCondition = (groupId: string) => {
    const newCondition: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: "",
      operator: "$eq",
      value: "",
    }

    function addToGroup(group: FilterGroup): FilterGroup {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, newCondition],
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => addToGroup(g)),
      }
    }

    const updated = addToGroup(rootGroup)
    setRootGroup(updated)
    onFiltersChange(groupToFilter(updated))
  }

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    function updateInGroup(group: FilterGroup): FilterGroup {
      return {
        ...group,
        conditions: group.conditions.map(cond =>
          cond.id === conditionId ? { ...cond, ...updates } : cond
        ),
        groups: group.groups.map(g => updateInGroup(g)),
      }
    }

    const updated = updateInGroup(rootGroup)
    setRootGroup(updated)
    onFiltersChange(groupToFilter(updated))
  }

  const removeCondition = (conditionId: string) => {
    function removeFromGroup(group: FilterGroup): FilterGroup {
      return {
        ...group,
        conditions: group.conditions.filter(cond => cond.id !== conditionId),
        groups: group.groups.map(g => removeFromGroup(g)),
      }
    }

    const updated = removeFromGroup(rootGroup)
    setRootGroup(updated)
    onFiltersChange(groupToFilter(updated))
  }

  const addGroup = (parentGroupId: string) => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      logicalOperator: "$and",
      conditions: [],
      groups: [],
    }

    function addToGroup(group: FilterGroup): FilterGroup {
      if (group.id === parentGroupId) {
        return {
          ...group,
          groups: [...group.groups, newGroup],
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => addToGroup(g)),
      }
    }

    const updated = addToGroup(rootGroup)
    setRootGroup(updated)
    onFiltersChange(groupToFilter(updated))
  }

  const updateLogicalOperator = (groupId: string, operator: LogicalOperator) => {
    function updateInGroup(group: FilterGroup): FilterGroup {
      if (group.id === groupId) {
        return { ...group, logicalOperator: operator }
      }
      return {
        ...group,
        groups: group.groups.map(g => updateInGroup(g)),
      }
    }

    const updated = updateInGroup(rootGroup)
    setRootGroup(updated)
    onFiltersChange(groupToFilter(updated))
  }

  const fields = fieldOptions[entityType] || []

  const renderGroup = (group: FilterGroup, depth: number = 0): JSX.Element => {
    return (
      <Card className={`${depth > 0 ? "ml-4 border-l-2" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Select
              value={group.logicalOperator}
              onValueChange={(value) => updateLogicalOperator(group.id, value as LogicalOperator)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$and">AND</SelectItem>
                <SelectItem value="$or">OR</SelectItem>
              </SelectContent>
            </Select>
            {depth > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Remove this group (simplified - would need proper group removal)
                  const updated = { ...rootGroup, groups: rootGroup.groups.filter(g => g.id !== group.id) }
                  setRootGroup(updated)
                  onFiltersChange(groupToFilter(updated))
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Conditions */}
          {group.conditions.map((condition) => {
            const field = fields.find(f => f.value === condition.field)
            const operator = operatorOptions.find(o => o.value === condition.operator)

            return (
              <div key={condition.id} className="flex gap-2 items-center">
                <Select
                  value={condition.field}
                  onValueChange={(value) => updateCondition(condition.id, { field: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(condition.id, { operator: value as FilterOperator })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {operator?.requiresValue && (
                  <>
                    {condition.operator === "$in" || condition.operator === "$not_in" ? (
                      <Input
                        placeholder="Comma-separated values"
                        value={Array.isArray(condition.value) ? condition.value.join(", ") : String(condition.value || "")}
                        onChange={(e) => {
                          const values = e.target.value.split(",").map(v => v.trim()).filter(Boolean)
                          updateCondition(condition.id, { value: values })
                        }}
                        className="flex-1"
                      />
                    ) : field?.type === "date" ? (
                      <Input
                        type="date"
                        value={condition.value ? new Date(condition.value as string).toISOString().split("T")[0] : ""}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="flex-1"
                      />
                    ) : field?.type === "number" ? (
                      <Input
                        type="number"
                        value={String(condition.value || "")}
                        onChange={(e) => updateCondition(condition.id, { value: parseFloat(e.target.value) || 0 })}
                        className="flex-1"
                      />
                    ) : (
                      <Input
                        placeholder="Value"
                        value={String(condition.value || "")}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="flex-1"
                      />
                    )}
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(condition.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}

          {/* Nested Groups */}
          {group.groups.map((nestedGroup) => (
            <div key={nestedGroup.id}>
              {renderGroup(nestedGroup, depth + 1)}
            </div>
          ))}

          {/* Add buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCondition(group.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addGroup(group.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {rootGroup.conditions.length === 0 && rootGroup.groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No filters applied</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => addCondition("root")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Filter
          </Button>
        </div>
      ) : (
        renderGroup(rootGroup)
      )}
    </div>
  )
}
