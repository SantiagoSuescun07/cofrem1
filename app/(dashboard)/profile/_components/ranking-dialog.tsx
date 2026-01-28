"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRanking } from "@/queries/games"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Medal, Award, User, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface RankingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RankingDialog({ open, onOpenChange }: RankingDialogProps) {
  const { data: rankingData, isLoading } = useRanking("general")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Filtrar el ranking basado en la búsqueda
  const filteredRanking = React.useMemo(() => {
    if (!rankingData?.ranking) return []
    if (!searchQuery.trim()) return rankingData.ranking

    const query = searchQuery.toLowerCase().trim()
    return rankingData.ranking.filter(
      (entry) =>
        entry.user.toLowerCase().includes(query) ||
        (entry.area && entry.area.toLowerCase().includes(query))
    )
  }, [rankingData?.ranking, searchQuery])

  // Limpiar búsqueda cuando se cierra el diálogo
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <User className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPositionBadgeColor = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return "bg-primary text-primary-foreground"
    }
    switch (position) {
      case 1:
        return "bg-yellow-500 text-yellow-950"
      case 2:
        return "bg-gray-400 text-gray-950"
      case 3:
        return "bg-amber-600 text-amber-950"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Ranking General</DialogTitle>
          <DialogDescription>
            Clasificación general de puntos acumulados
          </DialogDescription>
        </DialogHeader>

        {/* Campo de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o área..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredRanking.length > 0 ? (
          <div className="space-y-3">
            {filteredRanking.map((entry) => (
              <div
                key={entry.position}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                  entry.is_current_user
                    ? "bg-primary/10 border-primary shadow-md"
                    : "bg-card hover:bg-muted/50"
                )}
              >
                {/* Posición e ícono */}
                <div className="flex items-center justify-center w-16 shrink-0 gap-2">
                  <div className="flex items-center justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-lg font-bold leading-none",
                      entry.position <= 3 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {entry.position}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Pos
                    </span>
                  </div>
                </div>

                {/* Información del usuario */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-base truncate">
                      {entry.user}
                    </p>
                    {entry.is_current_user && (
                      <Badge variant="default" className="text-xs">
                        Tú
                      </Badge>
                    )}
                  </div>
                  {entry.area && (
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.area}
                    </p>
                  )}
                </div>

                {/* Puntos y juegos */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    className={cn(
                      "text-sm font-bold px-3 py-1",
                      getPositionBadgeColor(entry.position, entry.is_current_user)
                    )}
                  >
                    {entry.points} pts
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {entry.games_completed} juegos
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No se encontraron resultados para "{searchQuery}"</p>
            <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay datos de ranking disponibles</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

