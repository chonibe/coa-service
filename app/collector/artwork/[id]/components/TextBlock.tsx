"use client"



interface TextBlockProps {
  title?: string | null
  description: string | null
}

export function TextBlock({ title, description }: TextBlockProps) {
  if (!description) return null

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-line text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
