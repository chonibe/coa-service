type JsonLdProps = {
  id?: string
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Server-safe JSON-LD script. Pass validated schema.org-shaped objects.
 */
export function JsonLd({ id, data }: JsonLdProps) {
  const json = JSON.stringify(data)
  return (
    <script
      type="application/ld+json"
      id={id}
       
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
