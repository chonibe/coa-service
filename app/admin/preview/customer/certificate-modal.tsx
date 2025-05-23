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
    const rotateX = ((y - centerY) / centerY) * 8
    const rotateY = ((x - centerX) / centerX) * -8
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`
  }
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }
  return (
    <div
      ref={cardRef}
      className={`relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg transition-transform duration-400 hover:shadow-2xl overflow-hidden ${className}`}
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
    img.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.18,1.18,1.18)`
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
        className="w-full h-full object-cover rounded-lg shadow-lg transition-transform duration-700"
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