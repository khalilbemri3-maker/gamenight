import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useIsSuperAdmin } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import { Plus, Trash2, Edit2, ShoppingCart, Coffee, X, Package, AlertTriangle, Settings } from 'lucide-react'

const CATEGORIES = [
    { value: 'soft_drinks', label: 'Boissons Fraîches' },
    { value: 'water', label: 'Eau' },
    { value: 'hot_drinks', label: 'Boissons Chaudes' },
    { value: 'juices', label: 'Jus' },
    { value: 'energy_drinks', label: 'Boissons Énergét' },
    { value: 'other', label: 'Autres' },
]

function DrinkCard({ drink, onEdit, onDelete, onAddToCart, isSuperAdmin, cartQty, lowStockThreshold }) {
    const stockTracked = drink.stock !== null && drink.stock !== undefined
    const isOutOfStock = stockTracked && drink.stock === 0
    const isLowStock = stockTracked && drink.stock > 0 && drink.stock < lowStockThreshold
    const canAdd = !isOutOfStock && (!stockTracked || cartQty < drink.stock)

    return (
        <Card className={`hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{drink.name}</h3>
                        <p className="text-2xl font-bold text-orange-500 mt-1">
                            {formatPrice(drink.price)}
                        </p>
                        {stockTracked && (
                            <div className="mt-1">
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-medium ${
                                        isOutOfStock
                                            ? 'border-red-500 text-red-500 bg-red-500/10'
                                            : isLowStock
                                                ? 'border-amber-500 text-amber-600 bg-amber-500/10'
                                                : 'border-green-500 text-green-600 bg-green-500/10'
                                    }`}
                                >
                                    <Package className="w-3 h-3 mr-1" />
                                    {isOutOfStock ? 'Épuisé' : `Stock: ${drink.stock}`}
                                </Badge>
                            </div>
                        )}
                    </div>
                    {isSuperAdmin && (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onEdit(drink)}
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => onDelete(drink)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => onAddToCart(drink)}
                    className={`w-full ${
                        isOutOfStock
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                    size="sm"
                    disabled={!canAdd}
                >
                    {isOutOfStock ? (
                        <>
                            <X className="w-4 h-4 mr-1" />
                            Épuisé
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-1" />
                            {!canAdd ? 'Stock max atteint' : 'Ajouter'}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

export default function Boissons() {
    const { drinks, addNewDrink, editDrink, removeDrink, createBill, settings, updateAppSettings } = useApp()
    const isSuperAdmin = useIsSuperAdmin()
    const lowStockThreshold = settings?.lowStockThreshold ?? 5

    const [cart, setCart] = useState([])
    const [playerName, setPlayerName] = useState('')
    const [checkoutOpen, setCheckoutOpen] = useState(false)

    const [addDrinkOpen, setAddDrinkOpen] = useState(false)
    const [editingDrink, setEditingDrink] = useState(null)
    const [deletingDrink, setDeletingDrink] = useState(null)
    const [drinkForm, setDrinkForm] = useState({
        name: '',
        price: '',
        category: 'soft_drinks',
        stock: '',
    })

    // Low-stock threshold settings dialog
    const [thresholdOpen, setThresholdOpen] = useState(false)
    const [thresholdInput, setThresholdInput] = useState('')

    const handleOpenThreshold = () => {
        setThresholdInput(String(lowStockThreshold))
        setThresholdOpen(true)
    }

    const handleSaveThreshold = async () => {
        const val = parseInt(thresholdInput, 10)
        if (isNaN(val) || val < 1) return
        await updateAppSettings({ lowStockThreshold: val })
        setThresholdOpen(false)
    }

    const handleAddToCart = (drink) => {
        const existing = cart.find(item => item.id === drink.id)
        const currentQty = existing ? existing.quantity : 0
        // Don't exceed available stock
        if (drink.stock !== null && drink.stock !== undefined && currentQty >= drink.stock) return

        if (existing) {
            setCart(cart.map(item =>
                item.id === drink.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { ...drink, quantity: 1 }])
        }
    }

    const handleRemoveFromCart = (drinkId) => {
        setCart(cart.filter(item => item.id !== drinkId))
    }

    const handleUpdateQuantity = (drinkId, change) => {
        setCart(cart.map(item => {
            if (item.id === drinkId) {
                const newQuantity = item.quantity + change
                // Don't exceed stock
                if (change > 0 && item.stock !== null && item.stock !== undefined && newQuantity > item.stock) return item
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleCheckout = async () => {
        if (cart.length === 0) return

        // Create a bill with only drinks
        const sessionInfo = {
            counterId: null,
            counterType: null,
            counterName: 'Boissons',
            tableNumber: null,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 0,
            price: cartTotal,
            counterPrice: 0,
            drinksPrice: cartTotal,
            drinks: cart,
        }

        await createBill(sessionInfo, playerName.trim() || 'Client')

        // Reset cart
        setCart([])
        setPlayerName('')
        setCheckoutOpen(false)
    }

    const handleOpenAddDrink = () => {
        setDrinkForm({ name: '', price: '', category: 'soft_drinks', stock: '' })
        setAddDrinkOpen(true)
    }

    const handleOpenEditDrink = (drink) => {
        setDrinkForm({
            name: drink.name,
            price: drink.price.toString(),
            category: drink.category,
            stock: drink.stock !== null && drink.stock !== undefined ? drink.stock.toString() : '',
        })
        setEditingDrink(drink)
    }

    const handleSaveDrink = async () => {
        if (!drinkForm.name.trim() || !drinkForm.price) return
        const stockValue = drinkForm.stock !== '' ? parseInt(drinkForm.stock, 10) : null

        if (editingDrink) {
            await editDrink(editingDrink.id, {
                name: drinkForm.name.trim(),
                price: parseFloat(drinkForm.price),
                category: drinkForm.category,
                stock: stockValue,
            })
            setEditingDrink(null)
        } else {
            await addNewDrink({
                name: drinkForm.name.trim(),
                price: parseFloat(drinkForm.price),
                category: drinkForm.category,
                stock: stockValue,
            })
            setAddDrinkOpen(false)
        }
    }

    const handleDeleteDrink = async () => {
        if (!deletingDrink) return
        await removeDrink(deletingDrink.id)
        setDeletingDrink(null)
    }

    // Group drinks by category
    const drinksByCategory = {}
    drinks.forEach(drink => {
        if (!drinksByCategory[drink.category]) {
            drinksByCategory[drink.category] = []
        }
        drinksByCategory[drink.category].push(drink)
    })

    // Low-stock drinks (tracked and below threshold)
    const lowStockDrinks = drinks.filter(d => d.stock !== null && d.stock !== undefined && d.stock < lowStockThreshold)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Boissons</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {drinks.length} boisson{drinks.length > 1 ? 's' : ''} disponible{drinks.length > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isSuperAdmin && (
                        <Button onClick={handleOpenThreshold} variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Seuil stock
                        </Button>
                    )}
                    {isSuperAdmin && (
                        <Button onClick={handleOpenAddDrink} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouvelle Boisson
                        </Button>
                    )}
                    <Button
                        onClick={() => setCheckoutOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={cart.length === 0}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Panier ({cart.length})
                    </Button>
                </div>
            </div>
            {/* Low-stock warning banner */}
            {isSuperAdmin && lowStockDrinks.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                                    Stock faible — {lowStockDrinks.length} boisson{lowStockDrinks.length > 1 ? 's' : ''} à réapprovisionner
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {lowStockDrinks.map(d => (
                                        <Badge
                                            key={d.id}
                                            variant="outline"
                                            className={`${
                                                d.stock === 0
                                                    ? 'border-red-500 text-red-600 bg-red-500/10'
                                                    : 'border-amber-500 text-amber-600 bg-amber-500/10'
                                            }`}
                                        >
                                            {d.name}: {d.stock === 0 ? 'Épuisé' : d.stock + ' restant' + (d.stock > 1 ? 's' : '')}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            {cart.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-orange-600" />
                                <span className="font-semibold text-orange-900">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)} article{cart.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-orange-600">
                                {formatPrice(cartTotal)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Drinks by Category */}
            {CATEGORIES.map(category => {
                const categoryDrinks = drinksByCategory[category.value] || []
                if (categoryDrinks.length === 0) return null

                return (
                    <div key={category.value}>
                        <h2 className="text-xl font-semibold mb-4">{category.label}</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {categoryDrinks.map(drink => (
                                <DrinkCard
                                    key={drink.id}
                                    drink={drink}
                                    onEdit={handleOpenEditDrink}
                                    onDelete={setDeletingDrink}
                                    onAddToCart={handleAddToCart}
                                    isSuperAdmin={isSuperAdmin}
                                    cartQty={cart.find(i => i.id === drink.id)?.quantity || 0}
                                    lowStockThreshold={lowStockThreshold}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}

            {drinks.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune boisson disponible</p>
                        {isSuperAdmin && (
                            <Button onClick={handleOpenAddDrink} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une boisson
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Checkout Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Créer la facture</DialogTitle>
                        <DialogDescription>
                            Vérifiez votre panier et finalisez la facture
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Cart Items */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleUpdateQuantity(item.id, -1)}
                                        >
                                            -
                                        </Button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleUpdateQuantity(item.id, 1)}
                                        >
                                            +
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-600"
                                            onClick={() => handleRemoveFromCart(item.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-orange-500">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>

                        {/* Player Name */}
                        <div className="space-y-2">
                            <Label htmlFor="checkout-player-name">Nom du client (optionnel)</Label>
                            <Input
                                id="checkout-player-name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Ex: Ahmed"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleCheckout} className="bg-orange-500 hover:bg-orange-600">
                            Créer la facture
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Drink Dialog */}
            <Dialog open={addDrinkOpen || !!editingDrink} onOpenChange={(open) => {
                if (!open) {
                    setAddDrinkOpen(false)
                    setEditingDrink(null)
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDrink ? 'Modifier la boisson' : 'Nouvelle boisson'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="drink-name">Nom</Label>
                            <Input
                                id="drink-name"
                                value={drinkForm.name}
                                onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })}
                                placeholder="Ex: Coca Cola"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="drink-price">Prix (TND)</Label>
                            <Input
                                id="drink-price"
                                type="number"
                                step="0.5"
                                min="0"
                                value={drinkForm.price}
                                onChange={(e) => setDrinkForm({ ...drinkForm, price: e.target.value })}
                                placeholder="Ex: 2.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="drink-category">Catégorie</Label>
                            <Select
                                value={drinkForm.category}
                                onValueChange={(value) => setDrinkForm({ ...drinkForm, category: value })}
                            >
                                <SelectTrigger id="drink-category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="drink-stock">
                                Stock initial
                                <span className="text-xs text-muted-foreground ml-2">(laisser vide pour ne pas suivre le stock)</span>
                            </Label>
                            <Input
                                id="drink-stock"
                                type="number"
                                min="0"
                                step="1"
                                value={drinkForm.stock}
                                onChange={(e) => setDrinkForm({ ...drinkForm, stock: e.target.value })}
                                placeholder="Ex: 24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setAddDrinkOpen(false)
                            setEditingDrink(null)
                        }}>
                            Annuler
                        </Button>
                        <Button onClick={handleSaveDrink}>
                            {editingDrink ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingDrink} onOpenChange={(open) => !open && setDeletingDrink(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer la boisson</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{deletingDrink?.name}" ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingDrink(null)}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDrink}>
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Low-stock Threshold Dialog */}
            <Dialog open={thresholdOpen} onOpenChange={setThresholdOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-orange-500" />
                            Seuil d’alerte stock
                        </DialogTitle>
                        <DialogDescription>
                            Le stock sera considéré comme faible lorsqu’il passe en dessous de ce nombre. Actuellement : <strong>{lowStockThreshold}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="threshold-input">Seuil (nombre d’unités)</Label>
                            <Input
                                id="threshold-input"
                                type="number"
                                min="1"
                                step="1"
                                value={thresholdInput}
                                onChange={(e) => setThresholdInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveThreshold()}
                                className="text-center text-xl h-12 font-mono-timer"
                            />
                            <p className="text-xs text-muted-foreground">
                                Toute boisson avec un stock strictement inférieur à cette valeur sera signalée en alerte.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setThresholdOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveThreshold} className="bg-orange-500 hover:bg-orange-600">
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
