import React, { useRef, ReactNode } from 'react'

function FloatingTiltCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 10
    const rotateY = ((x - centerX) / centerX) * -10
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05,1.05,1.05)`
  }
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }
  return (
    <div
      ref={cardRef}
      className={`relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-zinc-600/50 overflow-hidden ${className}`}
      style={{ willChange: "transform" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      {...props}
    >
      {/* Shimmer overlay */}
      <span className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <span className="block w-full h-full shimmer" />
      </span>
      {children}
    </div>
  )
}

function FloatingTiltImage({ src, alt, className = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const imgRef = useRef<HTMLImageElement>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 10
    const rotateY = ((x - centerX) / centerX) * -10
    img.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.1,1.1,1.1)`
  }
  const handleMouseLeave = () => {
    const img = imgRef.current
    if (!img) return
    img.style.transform = ""
  }
  return (
    <div className={`relative w-48 h-48 flex-shrink-0 ${className}`} style={{ willChange: "transform" }}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg shadow-lg transition-transform duration-300"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        {...props}
      />
      {/* Shimmer overlay */}
      <span className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <span className="block w-full h-full shimmer" />
      </span>
    </div>
  )
}

export default FloatingTiltCard 