import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ComponentType, SVGProps } from "react"

interface SettingsLayoutProps {
  config: {
    title: string
    items: {
      title: string
      href: string
      icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>
    }[]
  }[]
  children?: React.ReactNode
}

export function SettingsLayout({ config, children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {config.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="font-medium">{group.title}</h4>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "transparent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
} 