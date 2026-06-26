export default function ExperienceLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading experience…</p>
      </div>
    </div>
  )
}
