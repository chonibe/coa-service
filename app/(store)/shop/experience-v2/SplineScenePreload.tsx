'use client'

import { useEffect } from 'react'

const SCENE_PATH = '/spline/splinemodel2/scene.splinecode'

/**
 * Preloads the Spline scene file when the experience page mounts.
 * Starts the ~6.7MB download early so it's cached before the 3D preview is needed.
 */
export function SplineScenePreload() {
  useEffect(() => {
    const existing = document.querySelector(`link[href="${SCENE_PATH}"]`)
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = SCENE_PATH
    link.as = 'fetch'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [])
  return null
}
