import { motion } from 'framer-motion'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Certificate, 
  Wifi, 
  WifiOff, 
  ExternalLink,
  Album
} from "lucide-react"

interface VinylArtworkCardProps {
  item: LineItem
  isSelected: boolean
  onSelect: () => void
  onCertificateView: () => void
}

export function VinylArtworkCard({
  item,
  isSelected,
  onSelect,
  onCertificateView
}: VinylArtworkCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        relative group overflow-hidden
        bg-zinc-900/50 backdrop-blur-sm
        border border-zinc-800
        rounded-xl transition-all duration-300
        ${isSelected ? 'ring-2 ring-amber-500' : ''}
      `}
    >
      {/* Artwork Image */}
      <div className="aspect-square relative overflow-hidden">
        {item.img_url ? (
          <img
            src={item.img_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Album className="w-20 h-20 text-zinc-700" />
          </div>
        )}
        
        {/* Authentication Status Badge */}
        <div className="absolute top-4 right-4">
          {item.nfc_claimed_at ? (
            <Badge className="bg-green-500/20 text-green-400 backdrop-blur-sm">
              <Wifi className="w-3 h-3 mr-1" />
              Authenticated
            </Badge>
          ) : (
            <Badge className="bg-amber-500/20 text-amber-400 backdrop-blur-sm">
              <WifiOff className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="
          absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          flex items-end justify-between p-4
        ">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">
              Edition {item.edition_number} of {item.edition_total}
            </p>
            <p className="text-xs text-zinc-400">
              {item.vendor_name}
            </p>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="bg-zinc-900/50 backdrop-blur-sm"
            onClick={onCertificateView}
          >
            <Certificate className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-1">
          {item.name}
        </h3>
        
        {/* Price and Links */}
        <div className="flex items-center justify-between">
          {item.price && (
            <p className="text-sm text-zinc-400">
              ${item.price.toFixed(2)}
            </p>
          )}
          
          {item.certificate_url && (
            <a
              href={item.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
} 