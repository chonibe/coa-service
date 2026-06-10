import fs from 'fs'
import { fileURLToPath } from 'url'

const path = fileURLToPath(
  new URL('../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx', import.meta.url)
)
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/)

// --- Phase 1: props (if missing) ---
let src = lines.join('\n')
if (!src.includes('pickerCardMode?:')) {
  src = src.replace(
    `  onCloseLampPickerDetail?: () => void
}`,
    `  onCloseLampPickerDetail?: () => void
  pickerCardMode?: 'toggleCart' | 'previewAndQuickAdd'
  onPreviewProduct?: (product: ShopifyProduct) => void
  onQuickAddProduct?: (product: ShopifyProduct) => void
  sheetVariant?: 'bottomSheet' | 'rightRail'
  presentation?: 'modal' | 'pushPanel'
  showDoneButton?: boolean
}`
  )
  src = src.replace(
    `  onCloseLampPickerDetail,
}: ArtworkPickerSheetProps) {`,
    `  onCloseLampPickerDetail,
  pickerCardMode = 'toggleCart',
  onPreviewProduct,
  onQuickAddProduct,
  sheetVariant = 'bottomSheet',
  presentation = 'modal',
  showDoneButton = true,
}: ArtworkPickerSheetProps) {`
  )
  src = src.replace(
    `  onSelect: (product: ShopifyProduct) => void
  priorityLoad?: boolean`,
    `  onSelect: (product: ShopifyProduct) => void
  onQuickAdd?: (product: ShopifyProduct) => void
  priorityLoad?: boolean`
  )
  src = src.replace(
    `  onSelect,
  priorityLoad = false,`,
    `  onSelect,
  onQuickAdd,
  priorityLoad = false,`
  )
  src = src.replace(
    `        {(isNewDrop || isEarlyAccess) && (
          <span`,
    `        {onQuickAdd && product.availableForSale && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd(product)
            }}
            className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-violet-300/40 bg-violet-600 text-white shadow-md shadow-violet-950/40 hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Quick add to cart"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </button>
        )}

        {(isNewDrop || isEarlyAccess) && (
          <span`
  )
  src = src.replace(
    `  const { pickerEngaged, orderDrawerOpen } = useExperienceOrder()

  useEffect(() => {
    if (prevSeasonRef.current !== activeSeason`,
    `  const { pickerEngaged, orderDrawerOpen } = useExperienceOrder()
  const [isDesktopRail, setIsDesktopRail] = useState(false)

  useEffect(() => {
    const q = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktopRail(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (prevSeasonRef.current !== activeSeason`
  )
  src = src.replace(
    `  }, [isOpen])

  const rows = useMemo`,
    `  }, [isOpen, presentation, isDesktopRail])

  const rows = useMemo`
  )
  src = src.replace(
    `    const dockedPush = presentation === 'pushPanel' && isDesktopRail
    if (dockedPush) return
    if (isOpen) {`,
    `    if (presentation === 'pushPanel' && isDesktopRail) return
    if (isOpen) {`
  )
  if (!src.includes('presentation === \'pushPanel\' && isDesktopRail) return')) {
    src = src.replace(
      `  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'`,
      `  useEffect(() => {
    if (presentation === 'pushPanel' && isDesktopRail) return
    if (isOpen) {
      document.body.style.overflow = 'hidden'`
    )
    src = src.replace(`  }, [isOpen])

  const rows`, `  }, [isOpen, presentation, isDesktopRail])

  const rows`)
  }
  if (!src.includes('cardSelectHandler')) {
    src = src.replace(
      `  const rows = useMemo(() => buildArtworkRowsByArtist(products), [products])

  const virtualizer = useVirtualizer({`,
      `  const rows = useMemo(() => buildArtworkRowsByArtist(products), [products])

  const cardSelectHandler = useCallback(
    (product: ShopifyProduct) => {
      if (pickerCardMode === 'previewAndQuickAdd' && onPreviewProduct) {
        onPreviewProduct(product)
        return
      }
      onToggleSelect(product)
    },
    [pickerCardMode, onPreviewProduct, onToggleSelect]
  )

  const quickAddHandler =
    pickerCardMode === 'previewAndQuickAdd' && onQuickAddProduct ? onQuickAddProduct : undefined

  const isRightRailDesktop = sheetVariant === 'rightRail' && isDesktopRail

  const virtualizer = useVirtualizer({`
    )
  }
  src = src.replaceAll('onSelect={onToggleSelect}', 'onSelect={cardSelectHandler}')
  src = src.replace(
    /onSelect=\{cardSelectHandler\}\n(\s+)priorityLoad=/g,
    'onSelect={cardSelectHandler}\n$1onQuickAdd={quickAddHandler}\n$1priorityLoad='
  )
  if (!src.includes('showDoneButton &&')) {
    src = src.replace(
      `              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Done"`,
      `              )}
              {showDoneButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Done"`
    )
    src = src.replace(
      `                Done
              </button>
              </motion.div>`,
      `                Done
              </button>
              )}
              </motion.div>`
    )
  }
  lines = src.split(/\r?\n/)
}

// --- Phase 2: renderPickerPanelBody ---
if (!src.includes('renderPickerPanelBody')) {
  lines = src.split(/\r?\n/)
  const start = lines.findIndex((l) =>
    l.includes('{/* Header: mobile = title + Done; desktop = two-zone bar')
  )
  let end = -1
  for (let i = start; i < lines.length; i++) {
    if (lines[i] === '            )}' && lines[i + 1] === '            </motion.div>') {
      end = i
      break
    }
  }
  if (start < 0 || end < 0) throw new Error(`range ${start} ${end}`)

  const innerLines = lines.slice(start, end + 1)
  const withoutInner = [
    ...lines.slice(0, start),
    '            {renderPickerPanelBody()}',
    ...lines.slice(end + 1),
  ]

  let ve = -1
  for (let i = 0; i < withoutInner.length; i++) {
    if (withoutInner[i].includes('const virtualizer = useVirtualizer(')) {
      for (let j = i; j < i + 10; j++) {
        if (withoutInner[j].trim() === '})') {
          ve = j
          break
        }
      }
      break
    }
  }

  const insert = [
    '',
    '  const docked = presentation === \'pushPanel\' && isDesktopRail',
    '',
    '  const renderPickerPanelBody = () => (',
    '    <>',
    ...innerLines,
    '    </>',
    '  )',
    '',
    '  if (docked) {',
    '    if (!isOpen) return null',
    '    return (',
    '      <div',
    '        className={cn(',
    "          'flex h-full min-h-0 w-full flex-col overflow-hidden shadow-2xl',",
    "          theme === 'light' ? 'border-l border-neutral-200 bg-white' : 'border-l border-white/10 bg-[#171515]'",
    '        )}',
    '      >',
    '        {renderPickerPanelBody()}',
    '      </motion.div>',
    '    )',
    '  }',
    '',
  ]

  const merged = [...withoutInner.slice(0, ve + 1), ...insert, ...withoutInner.slice(ve + 1)]
  src = merged.join('\n')

  src = src.replace(
    `          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[71] flex items-end justify-center pointer-events-none md:px-4 md:pb-5">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'flex w-full flex-col pointer-events-auto shadow-2xl',
                /* Mobile: nearly full viewport sheet */
                'max-w-full h-[calc(100dvh-10px)] max-h-[calc(100dvh-10px)] rounded-t-3xl',
                /* Desktop: wider shell (matches experience top chrome); floated panel with full rounding */
                'md:max-w-[min(92vw,768px)] md:rounded-2xl md:h-auto md:min-h-[65vh] md:max-h-[min(92vh,900px)]',
                theme === 'light' ? 'bg-white' : 'bg-[#171515]'
              )}
            >`,
    `          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div
            className={cn(
              'fixed inset-0 z-[71] flex pointer-events-none',
              'items-end justify-center md:px-4 md:pb-5',
              sheetVariant === 'rightRail' && 'md:items-stretch md:justify-end md:p-0'
            )}
          >
            <motion.div
              initial={isRightRailDesktop ? { x: '100%' } : { y: '100%' }}
              animate={isRightRailDesktop ? { x: 0 } : { y: 0 }}
              exit={isRightRailDesktop ? { x: '100%' } : { y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'flex w-full flex-col pointer-events-auto shadow-2xl',
                'max-w-full h-[calc(100dvh-10px)] max-h-[calc(100dvh-10px)] rounded-t-3xl',
                !isRightRailDesktop &&
                  'md:max-w-[min(92vw,768px)] md:rounded-2xl md:h-auto md:min-h-[65vh] md:max-h-[min(92vh,900px)]',
                isRightRailDesktop &&
                  'md:h-full md:max-h-none md:max-w-[min(440px,42vw)] md:rounded-none md:rounded-l-3xl',
                theme === 'light' ? 'bg-white' : 'bg-[#171515]'
              )}
            >`
  )

  src = src.replace(
    `            {renderPickerPanelBody()}
            </motion.div>
          </motion.div>`,
    `            {renderPickerPanelBody()}
            </motion.div>
          </div>`
  )

  // fix docked return typo motion.div -> div
  src = src.replace(
    `        {renderPickerPanelBody()}
      </motion.div>
    )
  }`,
    `        {renderPickerPanelBody()}
      </motion.div>
    )
  }`.replace('</motion.div>', '</motion.div>') // keep motion if we use motion.div
  )
}

// Fix docked block - use div not motion.div
src = src.replace(
  `      <div
        className={cn(
          'flex h-full min-h-0 w-full flex-col overflow-hidden shadow-2xl',
          theme === 'light' ? 'border-l border-neutral-200 bg-white' : 'border-l border-white/10 bg-[#171515]'
        )}
      >
        {renderPickerPanelBody()}
      </motion.div>`,
  `      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex h-full min-h-0 w-full flex-col overflow-hidden shadow-2xl',
          theme === 'light' ? 'border-l border-neutral-200 bg-white' : 'border-l border-white/10 bg-[#171515]'
        )}
      >
        {renderPickerPanelBody()}
      </motion.div>`
)

fs.writeFileSync(path, src, 'utf8')
console.log('OK')
