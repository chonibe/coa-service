'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InkOGatchiProps {
  stage?: number // Deprecated, using base item instead
  equippedItems?: {
    base?: string
    design?: string
    hat?: string
    eyes?: string
    body?: string
    accessory?: string
  }
  className?: string
  size?: number
  metadata?: any
}

export function InkOGatchi({ 
  equippedItems = {}, 
  className,
  size = 200,
  metadata = {}
}: InkOGatchiProps) {
  // Provided professional spray can paths
  const VectorPaths = ({ color = "#A0A0A0", stroke = "#333", effect = "none", design = null }: any) => (
    <g transform="translate(68, 15) scale(1.8)" strokeLinecap="round" strokeLinejoin="round">
      {/* Nozzle / Top Cap */}
      <path d="M21.74,0h-8.7v7.61h8.69V0h0ZM17.39,5.44c-1.2,0-2.17-.97-2.17-2.17s.97-2.17,2.17-2.17,2.17.97,2.17,2.17-.97,2.17-2.17,2.17Z" fill="#555" />
      <rect x="10.87" y="8.7" width="13.04" height="2.17" fill="#333" />
      <circle cx="17.39" cy="3.26" r="1.09" fill="#FFF" opacity="0.5" />
      
      {/* Shoulder Ring */}
      <polygon points="26.08 11.96 25 11.96 9.78 11.96 8.69 11.96 8.69 13.04 26.08 13.04 26.08 11.96" fill="#808080" stroke={stroke} strokeWidth="0.5" />
      
      {/* Upper Curve */}
      <path d="M7.61,19.57h26.09c0-3-2.44-5.43-5.44-5.43H6.52c-3,0-5.43,2.44-5.43,5.43h6.52Z" fill={color} stroke={stroke} strokeWidth="0.5" />
      
      {/* Design / Pattern Layer (Clipped to body) */}
      {design === 'splatter' && (
        <g opacity="0.6">
          <circle cx="10" cy="40" r="5" fill="#F5A623" />
          <circle cx="25" cy="70" r="8" fill="#50E3C2" />
          <circle cx="5" cy="85" r="4" fill="#D0021B" />
        </g>
      )}
      
      {/* Middle Trim */}
      <rect y="20.65" width="34.78" height="1.09" fill="#333" />
      
      {/* Main Body */}
      <polygon 
        points="33.69 22.83 22.61 22.83 12.17 22.83 10.87 22.83 1.09 22.83 1.09 97.83 33.69 97.83 33.69 22.83" 
        fill={color} 
        stroke={stroke} 
        strokeWidth="0.5" 
        className={effect === 'glow' ? 'animate-pulse' : ''}
      />
      
      {/* Bottom Rim */}
      <polygon points="1.09 98.91 0 98.91 0 100 34.78 100 34.78 98.91 33.69 98.91 1.09 98.91" fill="#333" />
    </g>
  )

  const renderAvatar = () => {
    const baseAsset = equippedItems.base || 'classic';
    const designAsset = equippedItems.design || null;
    
    // Determine colors and effects from metadata or hardcoded assets
    let color = "#A0A0A0";
    let effect = "none";
    
    if (baseAsset === 'vandal') {
      color = "#F8E71C";
      effect = "glow";
    } else if (baseAsset === 'classic') {
      color = "#A0A0A0";
    }

    return (
      <g>
        <VectorPaths color={color} effect={effect} design={designAsset} />
        
        {/* Face (Standard) */}
        <circle cx="92" cy="105" r="3" fill="#333" />
        <circle cx="108" cy="105" r="3" fill="#333" />
        <path d="M 95 125 Q 100 130 105 125" stroke="#333" strokeWidth="2" fill="none" />
        
        {/* Glow if legendary */}
        {effect === 'glow' && (
          <circle cx="100" cy="100" r="85" fill="none" stroke="#F8E71C" strokeWidth="2" strokeDasharray="10 5" className="animate-spin-slow" opacity="0.5" />
        )}
      </g>
    )
  }

  // Overlay items based on equippedItems
  const renderItem = (slot: string, assetUrl?: string) => {
    if (!assetUrl) return null

    if (assetUrl.includes('hat_red_cap')) {
      return (
        <g id="item-hat-red-cap" transform="translate(0, -15)">
          <path d="M 75 45 Q 100 15 125 45 L 140 55 L 140 65 L 75 65 Z" fill="#CC0000" stroke="#333" strokeWidth="2" />
        </g>
      )
    }
    if (assetUrl.includes('eyes_shades')) {
      return (
        <g id="item-eyes-shades" transform="translate(0, 5)">
          <rect x="75" y="90" width="50" height="12" rx="2" fill="#333" />
          <path d="M 75 96 L 125 96" stroke="#FFF" strokeWidth="1" opacity="0.3" />
        </g>
      )
    }
    if (assetUrl.includes('body_chain')) {
      return (
        <g id="item-body-chain" transform="translate(0, 35)">
          <path d="M 75 115 Q 100 145 125 115" fill="none" stroke="#FFD700" strokeWidth="4" />
          <circle cx="100" cy="140" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
          <text x="100" y="144" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold">INK</text>
        </g>
      )
    }

    return null
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Aura */}
        <circle cx="100" cy="100" r="80" fill="currentColor" className="text-gray-100 dark:text-gray-800" opacity="0.5" />
        
        {/* Base Avatar */}
        {renderAvatar()}

        {/* Equipped Items */}
        {renderItem('body', equippedItems.body)}
        {renderItem('eyes', equippedItems.eyes)}
        {renderItem('hat', equippedItems.hat)}
        {renderItem('accessory', equippedItems.accessory)}
      </svg>
    </div>
  )
}

