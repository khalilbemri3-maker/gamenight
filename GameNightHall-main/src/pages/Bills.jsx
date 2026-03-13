import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useAuth, useIsSuperAdmin } from '@/context/AuthContext'
import { getBillItems } from '@/lib/storage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import PrintReceipt from '@/components/PrintReceipt'
import { formatDuration, formatPrice, formatDate, formatTime } from '@/lib/utils'
import {
    Search,
    CheckCircle2,
    Clock,
    User,
    DollarSign,
    Trash2,
    AlertCircle,
    Filter,
    CreditCard,
    Grid3X3,
    Gamepad2,
    ChevronDown,
    ChevronUp,
    Receipt,
    Printer,
    Clock3,
    X,
} from 'lucide-react'

// ─── Per-counter type helpers ───────────────────────────────────────────────
const TYPE_ABBR  = { billard: 'BIL', playstation4: 'PS4', playstation5: 'PS5' }
const TYPE_BADGE = {
    billard:      'bg-blue-500/10   border-blue-500/20   text-blue-400',
    playstation4: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    playstation5: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
}

// ─── BillCard ────────────────────────────────────────────────────────────────
function BillCard({ bill, onPay, onDelete, user, counterName }) {
    const [showConfirmPay, setShowConfirmPay] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [billItems, setBillItems] = useState([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [showPrint, setShowPrint] = useState(false)

    const loadBillItems = useCallback(() => {
        if (bill.has_items && billItems.length === 0) {
            setLoadingItems(true)
            getBillItems(bill.id)
                .then(items => setBillItems(items || []))
                .catch(err => console.error('Error loading bill items:', err))
                .finally(() => setLoadingItems(false))
        }
    }, [bill.has_items, bill.id, billItems.length])

    useEffect(() => {
        if (bill.has_items && expanded && billItems.length === 0) loadBillItems()
    }, [bill.has_items, expanded, billItems.length, loadBillItems])

    const handlePrint = () => {
        if (bill.has_items && billItems.length === 0) {
            setLoadingItems(true)
            getBillItems(bill.id)
                .then(items => { setBillItems(items || []); setShowPrint(true) })
                .catch(err => console.error('Error loading bill items:', err))
                .finally(() => setLoadingItems(false))
        } else {
            setShowPrint(true)
        }
    }

    const abbr       = TYPE_ABBR[bill.counterType]  || `T${bill.tableNumber ?? '?'}`
    const badgeClass = TYPE_BADGE[bill.counterType] || 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    const displayName = counterName || 'Compteur'

    return (
        <>
            <Card className={`
                card-hover border-border/50 overflow-hidden
                ${!bill.paid
                    ? 'bg-gradient-to-br from-card to-amber-950/5 border-l-2 border-l-amber-500/50'
                    : 'bg-card'}
            `}>
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Left: Counter & Player info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${badgeClass}`}>
                                <span className="text-[11px] font-bold leading-tight">{abbr}</span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">
                                    {displayName}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-semibold truncate">{bill.playerName}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDuration(bill.duration)}
                                    </span>
                                    <span>{formatDate(bill.createdAt)}</span>
                                    <span>{formatTime(bill.startTime)} – {formatTime(bill.endTime)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Price & Actions */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-right">
                                <div className="text-lg font-bold text-orange-400 font-mono-timer">
                                    {formatPrice(bill.price)}
                                </div>
                                <Badge variant={bill.paid ? 'success' : 'warning'} className="text-[10px]">
                                    {bill.paid ? 'PAYÉE' : 'IMPAYÉE'}
                                </Badge>
                            </div>

                            {!bill.paid && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setShowConfirmPay(true)}
                                        className="bg-orange-600 hover:bg-orange-700 h-9"
                                    >
                                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                                        Payer
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handlePrint}
                                        style={{ backgroundColor: '#fe8541' }}
                                        className="hover:opacity-90 h-9 w-9 p-0"
                                        title="Imprimer"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                    </Button>
                                    {user?.role === 'superadmin' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowConfirmDelete(true)}
                                            className="h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            )}
                            {bill.paid && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handlePrint}
                                        style={{ backgroundColor: '#fe8541' }}
                                        className="hover:opacity-90 h-9 w-9 p-0"
                                        title="Imprimer"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                    </Button>
                                    {user?.role === 'superadmin' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowConfirmDelete(true)}
                                            className="h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Itemized breakdown */}
                    {bill.has_items && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between h-auto py-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setExpanded(!expanded)}
                            >
                                <span className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4" />
                                    <span className="text-sm font-medium">Détails de la facture</span>
                                </span>
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            {expanded && (
                                <div className="mt-3 space-y-2 bg-muted/20 rounded-lg p-3">
                                    {loadingItems ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">Chargement...</p>
                                    ) : billItems.length > 0 ? (
                                        <>
                                            {bill.cashierName && (
                                                <div className="flex justify-between text-sm pb-2 border-b border-border/50 mb-2">
                                                    <span className="text-muted-foreground">Caissier:</span>
                                                    <span className="font-medium">{bill.cashierName}</span>
                                                </div>
                                            )}
                                            {billItems.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {item.quantity > 1 && `${item.quantity}x `}
                                                        {item.itemName}
                                                    </span>
                                                    <span className="font-medium font-mono-timer">
                                                        {formatPrice(item.totalPrice)}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="border-t border-border/50 pt-2 mt-2">
                                                <div className="flex justify-between font-semibold">
                                                    <span>Total:</span>
                                                    <span className="text-orange-400 font-mono-timer">
                                                        {formatPrice(bill.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-2">Aucun détail disponible</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Pay */}
            <Dialog open={showConfirmPay} onOpenChange={setShowConfirmPay}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-orange-400" />
                            Confirmer le paiement
                        </DialogTitle>
                        <DialogDescription>
                            Marquer cette facture comme payée pour <strong>{bill.playerName}</strong> ?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">{displayName}</span>
                            <span className="font-mono-timer">{formatDuration(bill.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Montant</span>
                            <span className="text-lg font-bold text-orange-400">{formatPrice(bill.price)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmPay(false)}>Annuler</Button>
                        <Button
                            onClick={() => { onPay(bill.id); setShowConfirmPay(false) }}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmer le paiement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete */}
            <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            Supprimer la facture
                        </DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Annuler</Button>
                        <Button
                            variant="destructive"
                            onClick={() => { onDelete(bill.id); setShowConfirmDelete(false) }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Receipt */}
            {showPrint && (
                <Dialog open={showPrint} onOpenChange={setShowPrint}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Aperçu de l'impression</DialogTitle>
                            <DialogDescription>Ticket prêt pour imprimante thermique</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4" style={{ backgroundColor: '#f9fafb' }}>
                            <PrintReceipt bill={bill} billItems={billItems} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPrint(false)}>Fermer</Button>
                            <Button
                                onClick={() => window.print()}
                                style={{ backgroundColor: '#fe8541' }}
                                className="hover:opacity-90"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

// ─── Main Bills page ─────────────────────────────────────────────────────────
export default function Bills() {
    const { bills, payBill, removeBill, counters } = useApp()
    const { user } = useAuth()
    const isSuperAdmin = useIsSuperAdmin()

    const [search, setSearch]               = useState('')
    const [counterFilter, setCounterFilter] = useState('all')
    const [timeFrom, setTimeFrom]           = useState('')
    const [timeTo, setTimeTo]               = useState('')

    // Build counterId → counterName lookup
    const counterNameMap = useMemo(() => {
        const map = {}
        counters.forEach(c => { map[c.id] = c.name })
        return map
    }, [counters])

    // Get a human-readable name for a bill
    const getCounterLabel = useCallback((bill) => {
        if (bill.counterId && counterNameMap[bill.counterId]) return counterNameMap[bill.counterId]
        if (bill.counterType === 'billard')      return 'Billard'
        if (bill.counterType === 'playstation4') return 'PlayStation 4'
        if (bill.counterType === 'playstation5') return 'PlayStation 5'
        if (bill.tableNumber)                    return `Table ${bill.tableNumber}`
        return 'Compteur'
    }, [counterNameMap])

    // Master filter
    const filteredBills = useMemo(() => {
        const q = search.trim().toLowerCase()
        return bills.filter(b => {
            const label = getCounterLabel(b)

            // Search: player name OR counter name
            const matchSearch = !q
                || b.playerName?.toLowerCase().includes(q)
                || label.toLowerCase().includes(q)

            // Counter filter
            const matchCounter = counterFilter === 'all' || b.counterId === counterFilter

            // Time-of-day range filter (compares HH:MM string)
            let matchTime = true
            if (timeFrom || timeTo) {
                const raw = b.startTime || b.createdAt
                if (raw) {
                    const d   = new Date(raw)
                    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                    if (timeFrom && hhmm < timeFrom) matchTime = false
                    if (timeTo   && hhmm > timeTo)   matchTime = false
                }
            }

            return matchSearch && matchCounter && matchTime
        })
    }, [bills, search, counterFilter, timeFrom, timeTo, getCounterLabel])

    const filteredUnpaid = useMemo(() => filteredBills.filter(b => !b.paid), [filteredBills])
    const filteredPaid   = useMemo(() => filteredBills.filter(b =>  b.paid), [filteredBills])

    const totalUnpaid = useMemo(() => filteredUnpaid.reduce((s, b) => s + b.price, 0), [filteredUnpaid])
    const totalPaid   = useMemo(() => filteredPaid.reduce((s, b) => s + b.price, 0),   [filteredPaid])

    const isFiltered = search || counterFilter !== 'all' || timeFrom || timeTo

    return (
        <div className="space-y-6">

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Factures impayées</p>
                            <p className="text-xl font-bold text-amber-400">{filteredUnpaid.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Montant impayé total</p>
                            <p className="text-xl font-bold text-red-400">{formatPrice(totalUnpaid)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Factures payées</p>
                            <p className="text-xl font-bold text-green-400">{filteredPaid.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total encaissé</p>
                            <p className="text-xl font-bold text-orange-400">{formatPrice(totalPaid)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Filters ── */}
            <div className="space-y-3">
                {/* Row 1: Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par joueur, billard ou playstation…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-10 bg-card/50 border-border/50 h-10"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setSearch('')}
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                {/* Row 2: Counter filter buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={counterFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCounterFilter('all')}
                        className={`h-9 ${counterFilter === 'all' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    >
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        Tout
                    </Button>
                    {counters.map(c => (
                        <Button
                            key={c.id}
                            variant={counterFilter === c.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCounterFilter(counterFilter === c.id ? 'all' : c.id)}
                            className={`h-9 ${counterFilter === c.id ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                        >
                            {c.type === 'billard'
                                ? <Grid3X3 className="w-3.5 h-3.5 mr-1.5" />
                                : <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
                            }
                            {c.name}
                        </Button>
                    ))}
                </div>

                {/* Row 3: Time-range filter — SuperAdmin only */}
                {isSuperAdmin && (
                    <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock3 className="w-4 h-4" />
                            Plage horaire (aujourd'hui) :
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">De</span>
                            <Input
                                type="time"
                                value={timeFrom}
                                onChange={e => setTimeFrom(e.target.value)}
                                className="w-32 h-8 bg-card/50 border-border/50 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">À</span>
                            <Input
                                type="time"
                                value={timeTo}
                                onChange={e => setTimeTo(e.target.value)}
                                className="w-32 h-8 bg-card/50 border-border/50 text-sm"
                            />
                        </div>
                        {(timeFrom || timeTo) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setTimeFrom(''); setTimeTo('') }}
                                className="h-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Effacer
                            </Button>
                        )}
                    </div>
                )}

                {/* Active-filter indicator */}
                {isFiltered && (
                    <p className="text-xs text-muted-foreground">
                        Statistiques calculées sur la sélection filtrée —{' '}
                        <button className="underline hover:text-foreground" onClick={() => {
                            setSearch(''); setCounterFilter('all'); setTimeFrom(''); setTimeTo('')
                        }}>
                            Réinitialiser les filtres
                        </button>
                    </p>
                )}
            </div>

            {/* ── Bills tabs ── */}
            <Tabs defaultValue="unpaid" className="space-y-4">
                <TabsList className="bg-card border border-border/50 p-1">
                    <TabsTrigger value="unpaid" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Impayées ({filteredUnpaid.length})
                    </TabsTrigger>
                    <TabsTrigger value="paid" className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-400">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Payées ({filteredPaid.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid">
                    <div className="space-y-3">
                        {filteredUnpaid.length === 0 ? (
                            <Card className="border-border/50 bg-card/50">
                                <CardContent className="p-12 text-center">
                                    <ReceiptIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-1">Aucune facture impayée</h3>
                                    <p className="text-sm text-muted-foreground/60">
                                        {isFiltered ? 'Aucun résultat pour les filtres actifs.' : 'Toutes les factures ont été réglées !'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredUnpaid.map(bill => (
                                <BillCard
                                    key={bill.id}
                                    bill={bill}
                                    onPay={payBill}
                                    onDelete={removeBill}
                                    user={user}
                                    counterName={getCounterLabel(bill)}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="paid">
                    <div className="space-y-3">
                        {filteredPaid.length === 0 ? (
                            <Card className="border-border/50 bg-card/50">
                                <CardContent className="p-12 text-center">
                                    <ReceiptIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-1">Aucune facture payée</h3>
                                    <p className="text-sm text-muted-foreground/60">
                                        {isFiltered ? 'Aucun résultat pour les filtres actifs.' : 'Les factures payées apparaîtront ici.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredPaid.slice(0, 50).map(bill => (
                                <BillCard
                                    key={bill.id}
                                    bill={bill}
                                    onPay={payBill}
                                    onDelete={removeBill}
                                    user={user}
                                    counterName={getCounterLabel(bill)}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ReceiptIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
            <path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" />
        </svg>
    )
}
