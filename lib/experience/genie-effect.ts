/**
 * Genie effect - Mac OS X style "sucked into" animation.
 * Based on LorisSigrist/genie-demo (https://github.com/LorisSigrist/genie-demo)
 * Uses SVG feDisplacementMap for the curved funnel squeeze effect.
 */

function createId() {
  return Math.random().toString(36).slice(2)
}

function createLinear(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0
  const dy = y1 - y0
  return (y: number) => x0 + ((y - y0) * dx) / dy
}

function createQuadratic(x0: number, y0: number, x1: number, y1: number) {
  return (y: number) => x0 + Math.pow((y - y0) / (y1 - y0), 2) * (x1 - x0)
}

function generateBoundingBox(...points: DOMPoint[]) {
  const left = Math.min(...points.map((pt) => pt.x))
  const top = Math.min(...points.map((pt) => pt.y))
  const right = Math.max(...points.map((pt) => pt.x))
  const bottom = Math.max(...points.map((pt) => pt.y))
  return new DOMRect(left, top, right - left, bottom - top)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * Runs a genie exit animation: element gets squeezed into a funnel and flies to target.
 * @param element - Source element (will be moved to container, use a clone for non-destructive)
 * @param target - Destination element (e.g. heart icon)
 * @param options - duration in ms
 */
export function genieExit(
  element: HTMLElement,
  target: HTMLElement,
  options: { duration?: number } = {}
): Promise<void> {
  const duration = options.duration ?? 500
  const phase1Duration = duration * 0.35
  const phase2Duration = duration * 0.65

  const elementBounds = element.getBoundingClientRect()
  const targetBounds = target.getBoundingClientRect()

  const targetLeft = new DOMPoint(targetBounds.left, targetBounds.bottom)
  const targetRight = new DOMPoint(targetBounds.right, targetBounds.bottom)
  const elementLeft = new DOMPoint(elementBounds.left, elementBounds.bottom)
  const elementRight = new DOMPoint(elementBounds.right, elementBounds.bottom)

  const bb = generateBoundingBox(targetLeft, targetRight, elementLeft, elementRight)

  const container = document.createElement('div')
  const filterContainer = document.createElement('div')

  container.style.cssText = `
    position: absolute;
    top: ${bb.top + window.scrollY}px;
    left: ${bb.left}px;
    width: ${bb.width}px;
    height: ${bb.height}px;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `
  filterContainer.style.cssText = 'inset: 100%; height: 100%;'

  element.style.cssText = `
    position: absolute;
    bottom: 0;
    left: ${elementBounds.left - bb.left}px;
    width: ${elementBounds.width}px;
  `
  element.style.height = `${elementBounds.height}px`

  filterContainer.appendChild(element)
  container.appendChild(filterContainer)
  document.body.appendChild(container)

  const containerDimensions = container.getBoundingClientRect()
  const contentDimensions = element.getBoundingClientRect()

  const contentTop = Math.round(contentDimensions.y - containerDimensions.y)
  const contentBottom = Math.round(containerDimensions.height)
  const contentTopLeft = Math.round(contentDimensions.x - containerDimensions.x)
  const contentTopRight = Math.round(
    contentDimensions.width + contentDimensions.x - containerDimensions.x
  )

  const getLeft = createQuadratic(
    contentTopLeft,
    contentBottom,
    targetLeft.x - containerDimensions.x,
    0
  )
  const getRight = createQuadratic(
    contentTopRight,
    contentBottom,
    targetRight.x - containerDimensions.x,
    0
  )

  const maxDisplacementRight = targetLeft.x - containerDimensions.x
  const maxDisplacementLeft =
    containerDimensions.width - targetRight.x + containerDimensions.x
  const zeroValue = Math.round(
    (maxDisplacementLeft / (maxDisplacementRight + maxDisplacementLeft)) * 255
  )
  const displacementScale =
    Math.max(maxDisplacementRight, maxDisplacementLeft) * 1.15

  const depthMap = new ImageData(
    Math.round(containerDimensions.width),
    Math.round(containerDimensions.height)
  )

  for (let y = 0; y < depthMap.height; y++) {
    const left = getLeft(y)
    const right = getRight(y)
    const getPercentage = createLinear(0, left, 1, right)

    for (let x = 0; x < depthMap.width; x++) {
      const percentage = getPercentage(x)
      const offsetPx = x - percentage * contentDimensions.width
      const val = (offsetPx / displacementScale) * 255 + zeroValue
      const index = (y * depthMap.width + x) * 4
      depthMap.data[index] = val
      depthMap.data[index + 1] = 0
      depthMap.data[index + 2] = 0
      depthMap.data[index + 3] = 255
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = depthMap.width
  canvas.height = depthMap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    container.remove()
    return Promise.resolve()
  }
  ctx.putImageData(depthMap, 0, 0)

  const filterId = createId()
  const SVG_NS = 'http://www.w3.org/2000/svg'

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', String(depthMap.width))
  svg.setAttribute('height', String(depthMap.height))

  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', filterId)

  const feImage = document.createElementNS(SVG_NS, 'feImage')
  feImage.setAttribute('x', '0')
  feImage.setAttribute('y', '0')
  feImage.setAttribute('width', `${depthMap.width}px`)
  feImage.setAttribute('height', `${depthMap.height}px`)
  feImage.setAttribute('result', createId())
  feImage.setAttribute('color-interpolation-filters', 'sRGB')
  ;(feImage as SVGElement & { href: { baseVal: string } }).href.baseVal =
    canvas.toDataURL()

  const zeroPoint = zeroValue / 255
  const slope = zeroPoint <= 0.5 ? 0.5 / (1 - zeroPoint) : 0.5 / zeroPoint
  const intercept = 0.5 - zeroPoint * slope

  const feColorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix')
  feColorMatrix.setAttribute('in', feImage.getAttribute('result') ?? '')
  feColorMatrix.setAttribute('type', 'matrix')
  feColorMatrix.setAttribute(
    'values',
    `${slope} 0 0 0 ${intercept} 0 0 0 0 0 0 0 0 0 0.5 0 0 0 0 1 0`
  )
  feColorMatrix.setAttribute('result', createId())

  const feDisplacementMap = document.createElementNS(
    SVG_NS,
    'feDisplacementMap'
  )
  feDisplacementMap.setAttribute('in', 'SourceGraphic')
  feDisplacementMap.setAttribute('in2', feColorMatrix.getAttribute('result') ?? '')
  feDisplacementMap.setAttribute('scale', '0')
  feDisplacementMap.setAttribute('color-interpolation-filters', 'sRGB')
  feDisplacementMap.setAttribute('xChannelSelector', 'R')
  feDisplacementMap.setAttribute('yChannelSelector', 'B')

  const finalScaleValue = String(-displacementScale * 2)
  const animateEl = document.createElementNS(SVG_NS, 'animate')
  animateEl.setAttribute('attributeName', 'scale')
  animateEl.setAttribute('from', '0')
  animateEl.setAttribute('to', finalScaleValue)
  animateEl.setAttribute('dur', `${phase1Duration}ms`)
  animateEl.setAttribute('fill', 'freeze')
  feDisplacementMap.appendChild(animateEl)

  filter.appendChild(feImage)
  filter.appendChild(feColorMatrix)
  filter.appendChild(feDisplacementMap)
  svg.appendChild(filter)

  document.body.appendChild(svg)
  svg.style.cssText =
    'position:fixed;top:-100%;left:-100%;z-index:-999999;pointer-events:none;opacity:0'

  filterContainer.style.filter = `url(#${filterId})`

  const cleanUp = () => {
    container.remove()
    svg.remove()
  }

  const animatePhase2 = (el: HTMLElement, dist: number) => {
    return new Promise<void>((resolve) => {
      if (isSafari()) {
        const start = performance.now()
        const end = start + phase2Duration
        function step() {
          const now = performance.now()
          const progress = Math.min(1, (now - start) / phase2Duration)
          const value = dist * progress
          el.style.transform = `translateY(-${value}px)`
          if (now < end) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      } else {
        const anim = el.animate(
          [
            { transform: 'translateY(0)' },
            { transform: `translateY(-${dist}px)` },
          ],
          { duration: phase2Duration, easing: 'ease-in', fill: 'forwards' }
        )
        anim.onfinish = () => resolve()
      }
    })
  }

  return sleep(phase1Duration)
    .then(() =>
      animatePhase2(element, containerDimensions.height)
    )
    .then(cleanUp)
}
