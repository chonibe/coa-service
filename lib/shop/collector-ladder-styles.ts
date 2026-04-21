import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'

/** Badge + ladder column styles aligned with collector-first mocks (teal / amber / coral / rose / stone). */
export function ladderStageBadgeClass(stage: StreetPricingStageKey): string {
  switch (stage) {
    case 'ground_floor':
      return 'bg-[#E1F5EE] text-[#085041]'
    case 'rising':
      return 'bg-[#FAEEDA] text-[#633806]'
    case 'established':
      return 'bg-[#FAECE7] text-[#4A1B0C]'
    case 'final':
      return 'bg-[#FBEAF0] text-[#4B1528]'
    case 'archive':
    default:
      return 'bg-[#F1EFE8] text-[#2C2C2A]'
  }
}

export function ladderStageColumnClass(stage: StreetPricingStageKey): string {
  switch (stage) {
    case 'ground_floor':
      return 'bg-[#E1F5EE] text-[#04342C]'
    case 'rising':
      return 'bg-[#FAEEDA] text-[#412402]'
    case 'established':
      return 'bg-[#FAECE7] text-[#4A1B0C]'
    case 'final':
      return 'bg-[#FBEAF0] text-[#4B1528]'
    case 'archive':
    default:
      return 'bg-[#F1EFE8] text-[#2C2C2A]'
  }
}

/** Title-case label for UI (API still returns ALL CAPS ladder labels). */
export function ladderStageShortLabel(stage: StreetPricingStageKey): string {
  switch (stage) {
    case 'ground_floor':
      return 'Ground floor'
    case 'rising':
      return 'Rising'
    case 'established':
      return 'Established'
    case 'final':
      return 'Final edition'
    case 'archive':
      return 'Sold out'
    default:
      return 'Sold out'
  }
}
