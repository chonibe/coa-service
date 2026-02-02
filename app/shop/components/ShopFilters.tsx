'use client'

interface ShopFiltersProps {
  collections: { handle: string; title: string }[]
  currentCollection?: string
  currentSort: string
  productCount: number
}

export function ShopFilters({ 
  collections, 
  currentCollection, 
  currentSort, 
  productCount 
}: ShopFiltersProps) {
  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href)
    if (e.target.value) {
      url.searchParams.set('collection', e.target.value)
    } else {
      url.searchParams.delete('collection')
    }
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href)
    url.searchParams.set('sort', e.target.value)
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-[#1a1a1a]/10">
      {/* Collection Filter */}
      <div className="flex items-center gap-4">
        <select
          defaultValue={currentCollection || ''}
          onChange={handleCollectionChange}
          className="h-10 px-4 pr-10 text-sm bg-white border border-[#1a1a1a]/12 rounded-[8px] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2c4bce]"
        >
          <option value="">All Collections</option>
          {collections.map((col) => (
            <option key={col.handle} value={col.handle}>
              {col.title}
            </option>
          ))}
        </select>
        
        <span className="text-sm text-[#1a1a1a]/60">
          {productCount} {productCount === 1 ? 'artwork' : 'artworks'}
        </span>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#1a1a1a]/60">Sort by:</span>
        <select
          defaultValue={currentSort}
          onChange={handleSortChange}
          className="h-10 px-4 pr-10 text-sm bg-white border border-[#1a1a1a]/12 rounded-[8px] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2c4bce]"
        >
          <option value="best-selling">Best Selling</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="title-az">Title: A-Z</option>
          <option value="title-za">Title: Z-A</option>
        </select>
      </div>
    </div>
  )
}
