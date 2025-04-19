"use client"

export function TailwindIndicator() {
  return (
    <div className="fixed top-0 left-0 flex justify-center w-full pointer-events-none">
      <div className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-b-md">
        <span className="text-xs font-medium">Tailwind CSS is working</span>
      </div>
    </div>
  )
}
