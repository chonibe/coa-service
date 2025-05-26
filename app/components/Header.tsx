import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="w-full border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          The Street Lamp
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/admin/login">
            <Button variant="outline">
              Login
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
} 