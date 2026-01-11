'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InkOGatchi } from './ink-o-gatchi'
import { Loader2, Shirt, ShoppingBag, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface InkOGatchiWidgetProps {
  userId?: string
  email?: string
}

export function InkOGatchiWidget({ userId, email }: InkOGatchiWidgetProps) {
  const [avatar, setAvatar] = useState<any>(null)
  const [shopItems, setShopItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAvatar()
    fetchShopItems()
  }, [userId, email])

  const fetchAvatar = async () => {
    try {
      const query = userId || email ? `?userId=${userId || ''}&email=${email || ''}` : ''
      const res = await fetch(`/api/collector/avatar${query}`)
      const data = await res.json()
      if (data.success) {
        setAvatar(data.avatar)
      }
    } catch (err) {
      console.error('Failed to fetch avatar', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchShopItems = async () => {
    try {
      const res = await fetch('/api/collector/avatar/shop')
      const data = await res.json()
      if (data.success) {
        setShopItems(data.items)
      }
    } catch (err) {
      console.error('Failed to fetch shop items', err)
    }
  }

  const handleEquip = async (slot: string, item: any) => {
    setIsUpdating(true)
    try {
      const newEquipped = { ...avatar.equippedItems }
      if (item) {
        newEquipped[slot] = item.id
      } else {
        delete newEquipped[slot]
      }

      // We only need to send IDs to the server
      const idMap: Record<string, number | null> = {}
      Object.entries(newEquipped).forEach(([s, i]: [string, any]) => {
        idMap[s] = i.id || i
      })

      const res = await fetch('/api/collector/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equippedItems: idMap, userId, email })
      })
      const data = await res.json()
      if (data.success) {
        setAvatar(data.avatar)
        toast({ title: 'Avatar updated!', description: 'Your Ink-O-Gatchi looks great.' })
      }
    } catch (err) {
      toast({ title: 'Failed to update avatar', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBuy = async (itemId: number) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/collector/avatar/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, userId, email })
      })
      const data = await res.json()
      if (data.success) {
        setAvatar(data.avatar)
        toast({ title: 'Purchase successful!', description: data.message })
      } else {
        toast({ title: 'Purchase failed', description: data.error, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!avatar) return null

  const { xpInfo, level, evolutionStage, equippedItems, inventory } = avatar

  // Map equipped items to just their asset URLs for the renderer
  const equippedAssets = {
    base: equippedItems.base?.asset_url,
    design: equippedItems.design?.asset_url,
    hat: equippedItems.hat?.asset_url,
    eyes: equippedItems.eyes?.asset_url,
    body: equippedItems.body?.asset_url,
    accessory: equippedItems.accessory?.asset_url,
  }

  // Map inventory for easy checking
  const ownedItemIds = inventory.map((i: any) => i.item_id)

  return (
    <Card className="w-full overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Ink-O-Gatchi
              <Badge variant="outline" className="text-primary font-bold">LVL {level}</Badge>
            </CardTitle>
            <CardDescription>Customize your collectible cans</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Shirt className="h-4 w-4" />
                  Wardrobe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Customize your Ink-O-Gatchi</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="wardrobe">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wardrobe">My Closet</TabsTrigger>
                    <TabsTrigger value="shop">Shop</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="wardrobe" className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-center bg-muted rounded-xl p-4">
                        <InkOGatchi equippedItems={equippedAssets} size={200} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Equipped Parts</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                          {['base', 'design', 'hat', 'eyes', 'body', 'accessory'].map(slot => {
                            const item = equippedItems[slot]
                            return (
                              <div key={slot} className="flex items-center justify-between p-2 border rounded-lg bg-card">
                                <span className="text-sm capitalize font-medium">{slot}:</span>
                                {item ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">{item.rarity || 'Common'}</span>
                                    <span className="text-sm text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="xs" 
                                      className="h-7 px-2 text-destructive"
                                      onClick={() => handleEquip(slot, null)}
                                      disabled={isUpdating}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Empty</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">My Inventory</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {inventory.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-4 py-4 text-center">Your inventory is empty. Visit the shop!</p>
                        ) : (
                          inventory.map((inv: any) => (
                            <Button
                              key={inv.avatar_items.id}
                              variant={equippedItems[inv.avatar_items.type]?.id === inv.avatar_items.id ? "default" : "outline"}
                              className="h-auto flex-col p-2 gap-1"
                              onClick={() => handleEquip(inv.avatar_items.type, inv.avatar_items)}
                              disabled={isUpdating}
                            >
                              <span className="text-[10px] capitalize text-muted-foreground">{inv.avatar_items.type}</span>
                              <span className="text-xs font-bold truncate w-full">{inv.avatar_items.name}</span>
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="shop" className="space-y-4 py-4">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-sm font-medium">Credits: <span className="text-primary font-bold">{xpInfo.totalCredits || 0}</span></p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {shopItems.map(item => (
                        <div key={item.id} className="border rounded-xl p-3 flex flex-col gap-2 bg-card relative overflow-hidden group">
                          <div className={`absolute inset-0 opacity-5 ${
                            item.rarity === 'Legendary' ? 'bg-amber-500' : 
                            item.rarity === 'Epic' ? 'bg-purple-500' : 
                            item.rarity === 'Rare' ? 'bg-blue-500' : 'hidden'
                          }`} />
                          <div className="flex justify-between items-start relative z-10">
                            <Badge variant="secondary" className="text-[10px] uppercase">{item.type}</Badge>
                            <Badge variant="outline" className={`text-[9px] font-bold ${
                              item.rarity === 'Legendary' ? 'text-amber-600 border-amber-200' : 
                              item.rarity === 'Epic' ? 'text-purple-600 border-purple-200' : 
                              item.rarity === 'Rare' ? 'text-blue-600 border-blue-200' : 'text-slate-400'
                            }`}>{item.rarity || 'Common'}</Badge>
                          </div>
                          <p className="font-bold text-sm truncate relative z-10">{item.name}</p>
                          <div className="mt-auto flex flex-col gap-2 relative z-10">
                            <div className="flex items-center gap-1 text-sm font-bold text-primary">
                              {item.credit_cost} <span className="text-[10px] text-muted-foreground">credits</span>
                            </div>
                            {ownedItemIds.includes(item.id) ? (
                              <Button variant="ghost" size="sm" disabled className="w-full">Owned</Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="w-full"
                                disabled={isUpdating || level < item.required_level || xpInfo.totalCredits < item.credit_cost}
                                onClick={() => handleBuy(item.id)}
                              >
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center py-4 bg-muted/50 rounded-2xl relative overflow-hidden group">
            <InkOGatchi equippedItems={equippedAssets} size={180} />
            <div className="absolute bottom-2 right-2">
              <Badge className={`border-none px-3 py-1 ${
                equippedItems.base?.rarity === 'Legendary' ? 'bg-amber-500 text-white' :
                equippedItems.base?.rarity === 'Epic' ? 'bg-purple-500 text-white' :
                equippedItems.base?.rarity === 'Rare' ? 'bg-blue-500 text-white' :
                'bg-primary/20 text-primary'
              }`}>
                {equippedItems.base?.name || 'Classic Can'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Experience Points</span>
                <span className="text-muted-foreground">{xpInfo.xpIntoLevel} / {xpInfo.xpRequiredForNextLevel} XP</span>
              </div>
              <Progress value={xpInfo.progress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/60 p-3 rounded-xl border border-primary/10">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Ink Credits</p>
                <p className="text-xl font-black text-primary">{xpInfo.totalCredits || 0}</p>
              </div>
              <div className="bg-background/60 p-3 rounded-xl border border-primary/10">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Total Earned</p>
                <p className="text-xl font-black text-muted-foreground">{xpInfo.totalCreditsEarned || 0}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button size="sm" className="w-full justify-between group" onClick={() => (window.location.href = '/collector/perks')}>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Redeem Rewards
                </span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">New Perks Available</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

