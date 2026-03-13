import React, { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/utils'
import { Plus, Minus, Coffee, X, Wine, Droplet, Soup, Apple, Zap, MoreHorizontal, Package } from 'lucide-react'

const CATEGORIES = [
    { value: 'all', label: 'Tout', icon: MoreHorizontal },
    { value: 'soft_drinks', label: 'Soft', icon: Wine },
    { value: 'water', label: 'Eau', icon: Droplet },
    { value: 'hot_drinks', label: 'Chaud', icon: Soup },
    { value: 'juices', label: 'Jus', icon: Apple },
    { value: 'energy_drinks', label: 'Energy', icon: Zap },
]

export default function DrinkSelectionDialog({ open, onOpenChange, counter }) {
    const { drinks, setCounterDrinks, settings } = useApp()
    const [selectedDrinks, setSelectedDrinks] = useState({})
    const [activeCategory, setActiveCategory] = useState('all')

    // Pre-populate with existing counter drinks every time the dialog opens
    useEffect(() => {
        if (open) {
            const initial = {}
            if (counter?.drinks) {
                counter.drinks.forEach(d => {
                    if (!d.__multiplier && d.id) {
                        initial[d.id] = d.quantity || 1
                    }
                })
            }
            setSelectedDrinks(initial)
        }
    }, [open, counter?.id])

    // drink.stock from context is already effective (DB minus ALL active carts including this one).
    // Add back this counter's own reservation to get the real ceiling for this session.
    const originalQtyForDrink = (drinkId) =>
        counter?.drinks?.find(d => d.id === drinkId)?.quantity || 0

    const handleAddDrink = (drink) => {
        if (drink.stock !== null && drink.stock !== undefined) {
            const currentQty = selectedDrinks[drink.id] || 0
            const maxAllowed = drink.stock + originalQtyForDrink(drink.id)
            if (currentQty >= maxAllowed) return
        }
        setSelectedDrinks(prev => ({
            ...prev,
            [drink.id]: (prev[drink.id] || 0) + 1,
        }))
    }

    const handleRemoveDrink = (drinkId) => {
        setSelectedDrinks(prev => {
            const newQty = (prev[drinkId] || 0) - 1
            if (newQty <= 0) {
                const { [drinkId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [drinkId]: newQty }
        })
    }

    const handleConfirm = () => {
        const newDrinks = Object.entries(selectedDrinks)
            .filter(([, qty]) => qty > 0)
            .map(([drinkId, quantity]) => {
                const drink = drinks.find(d => d.id === drinkId)
                    || counter?.drinks?.find(d => d.id === drinkId)
                return drink ? { ...drink, quantity } : null
            })
            .filter(Boolean)
        setCounterDrinks(counter.id, newDrinks)
        setSelectedDrinks({})
        onOpenChange(false)
    }

    const handleCancel = () => {
        setSelectedDrinks({})
        onOpenChange(false)
    }

    const totalItems = Object.values(selectedDrinks).reduce((sum, qty) => sum + qty, 0)
    const totalPrice = Object.entries(selectedDrinks).reduce((sum, [drinkId, qty]) => {
        const drink = drinks.find(d => d.id === drinkId)
            || counter?.drinks?.find(d => d.id === drinkId)
        return sum + (drink ? drink.price * qty : 0)
    }, 0)

    const hadDrinksBefore = (counter?.drinks || []).filter(d => !d.__multiplier).length > 0

    const filteredDrinks = activeCategory === 'all'
        ? drinks
        : drinks.filter(d => d.category === activeCategory)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 flex flex-col">
                {/* Fixed Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Coffee className="w-5 h-5 text-orange-500" />
                        <span>Boissons - {counter?.name}</span>
                    </DialogTitle>
                    {hadDrinksBefore && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Ajustez les quantités ou supprimez des boissons déjà ajoutées.
                        </p>
                    )}
                </DialogHeader>

                {/* Category Tabs */}
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 shrink-0">
                        <TabsList className="w-full grid grid-cols-6 h-auto">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon
                                const categoryCount = cat.value === 'all'
                                    ? drinks.length
                                    : drinks.filter(d => d.category === cat.value).length
                                return (
                                    <TabsTrigger
                                        key={cat.value}
                                        value={cat.value}
                                        className="flex flex-col items-center gap-1 py-2"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs">{cat.label}</span>
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                            {categoryCount}
                                        </Badge>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>

                    {/* Scrollable drink list */}
                    <TabsContent
                        value={activeCategory}
                        className="flex-1 mt-0 overflow-y-auto px-6 py-4"
                        style={{ minHeight: 0 }}
                    >
                        {filteredDrinks.length > 0 ? (
                            <div className="grid gap-3 pb-2">
                                {filteredDrinks.map(drink => {
                                    const qty = selectedDrinks[drink.id] || 0
                                    const origQty = originalQtyForDrink(drink.id)
                                    const maxAllowed = drink.stock !== null && drink.stock !== undefined
                                        ? drink.stock + origQty
                                        : Infinity
                                    const canAdd = maxAllowed === Infinity || qty < maxAllowed
                                    // Fully unavailable = no stock AND not already in this counter's cart
                                    const isFullyUnavailable = drink.stock !== null && drink.stock !== undefined
                                        && drink.stock === 0 && origQty === 0

                                    return (
                                        <div
                                            key={drink.id}
                                            className={`
                                                flex items-center justify-between p-4 rounded-lg border transition-all
                                                ${qty > 0
                                                    ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                                                    : 'border-border bg-card hover:bg-muted/50 hover:border-orange-300'
                                                }
                                            `}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="font-semibold text-base truncate">{drink.name}</p>
                                                <p className="text-lg font-bold text-orange-500 mt-0.5">
                                                    {formatPrice(drink.price)}
                                                </p>
                                                {drink.stock !== null && drink.stock !== undefined && (
                                                    <div className="mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] px-1 py-0 h-4 ${
                                                                isFullyUnavailable
                                                                    ? 'border-red-500 text-red-500'
                                                                    : (drink.stock + origQty) < (settings?.lowStockThreshold ?? 5)
                                                                        ? 'border-amber-500 text-amber-600'
                                                                        : 'border-green-500 text-green-600'
                                                            }`}
                                                        >
                                                            <Package className="w-2.5 h-2.5 mr-0.5" />
                                                            {isFullyUnavailable
                                                                ? 'Épuisé'
                                                                : `${drink.stock + origQty} dispo`}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {qty > 0 ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 w-9 p-0"
                                                            onClick={() => handleRemoveDrink(drink.id)}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </Button>
                                                        <div className="w-12 text-center">
                                                            <Badge className="bg-orange-500 hover:bg-orange-600 text-base px-3 py-1">
                                                                {qty}
                                                            </Badge>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 w-9 p-0"
                                                            onClick={() => handleAddDrink(drink)}
                                                            disabled={!canAdd}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-orange-500 hover:bg-orange-600 h-9 px-4"
                                                        onClick={() => handleAddDrink(drink)}
                                                        disabled={isFullyUnavailable}
                                                    >
                                                        {isFullyUnavailable ? 'Épuisé' : (
                                                            <><Plus className="w-4 h-4 mr-1" />Ajouter</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                                <Coffee className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Aucune boisson disponible</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Fixed Footer */}
                <div className="border-t bg-background shrink-0">
                    {/* Selection summary */}
                    {totalItems > 0 && (
                        <div className="px-6 pt-4">
                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Total sélection : {totalItems} article{totalItems > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-2xl font-bold text-orange-600 mt-1">
                                            {formatPrice(totalPrice)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedDrinks({})}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Tout retirer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="px-6 py-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel} className="px-6">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="bg-orange-500 hover:bg-orange-600 px-6"
                            disabled={!hadDrinksBefore && totalItems === 0}
                        >
                            {hadDrinksBefore
                                ? 'Mettre à jour'
                                : <><Plus className="w-4 h-4 mr-2" />Ajouter au compteur</>
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

