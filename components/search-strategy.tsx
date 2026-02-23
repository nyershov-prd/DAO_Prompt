"use client"

import { useState, useCallback } from "react"
import {
  RotateCcw,
  Plus,
  Settings2,
  ArrowDown,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StrategyRow, type StrategyLayer, type GroupLogic } from "@/components/strategy-row"

// ── Types ──────────────────────────────────────────────────────────────────────

type ParsedStrategy = {
  fallbackOrder: string[]
  sources: { answerBank: boolean; supporting: boolean }
  priorityLabel: string
  verbatim: boolean
}

// ── Default state ──────────────────────────────────────────────────────────────

const DEFAULT_LAYERS: StrategyLayer[] = [
  {
    id: "1",
    conditions: [
      { field: "Fund", operator: "equals", values: ["Fund I"], exclude: false },
      { field: "Vehicle", operator: "equals", values: ["LP", "SMA"], exclude: false },
    ],
    groupLogic: "AND",
    useAnswerBank: true,
    useSupportingMaterials: true,
    useVerbatim: true,
  },
  {
    id: "2",
    conditions: [{ field: "Fund", operator: "equals", values: ["Fund I"], exclude: false }],
    groupLogic: "AND",
    useAnswerBank: true,
    useSupportingMaterials: true,
    useVerbatim: true,
  },
  {
    id: "3",
    conditions: [{ field: "Strategy", operator: "equals", values: ["Long/Short"], exclude: false }],
    groupLogic: "AND",
    useAnswerBank: true,
    useSupportingMaterials: false,
    useVerbatim: true,
  },
]

const DEFAULT_PROMPT =
  "Start with Fund I + Vehicle (LP or SMA) responses from the Answer Bank. If none found, expand to Fund I only, then Long/Short Strategy, then Firmwide. Prefer Answer Bank over Supporting Materials. Ensure all answers are extracted verbatim from the Answer Bank or source material — do not generate AI responses."

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildLayerLabel(layer: StrategyLayer): string {
  const parts = layer.conditions.map((c) => {
    const prefix = c.exclude ? "!" : ""
    return `${prefix}${c.field}`
  })
  const joiner = layer.groupLogic === "AND" ? " + " : " | "
  return parts.join(joiner)
}

/** Derive a structured preview from the current layers state */
function derivePreviewFromLayers(layers: StrategyLayer[]): ParsedStrategy {
  const fallbackOrder = layers.map((l) => buildLayerLabel(l))
  let answerBank = false
  let supporting = false
  for (const l of layers) {
    if (l.useAnswerBank) answerBank = true
    if (l.useSupportingMaterials) supporting = true
  }
  const abCount = layers.filter((l) => l.useAnswerBank && !l.useSupportingMaterials).length
  const smCount = layers.filter((l) => l.useSupportingMaterials && !l.useAnswerBank).length
  let priorityLabel = "Balanced"
  if (abCount > smCount) priorityLabel = "Answer Bank first"
  else if (smCount > abCount) priorityLabel = "Supporting Materials first"
  const verbatimCount = layers.filter((l) => l.useVerbatim).length
  return { fallbackOrder, sources: { answerBank, supporting }, priorityLabel, verbatim: verbatimCount > 0 }
}

// ── Preview strip ──────────────────────────────────────────────────────────────

function StrategyPreview({ preview }: { preview: ParsedStrategy }) {
  const { fallbackOrder, sources, priorityLabel, verbatim } = preview
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2.5 space-y-2">
      {/* Fallback order */}
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 pt-0.5 shrink-0">
          Fallback
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {fallbackOrder.map((label, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                  {i + 1}
                </span>
                {label}
              </span>
              {i < fallbackOrder.length - 1 && (
                <span className="text-muted-foreground/40 text-[10px]">→</span>
              )}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/40 text-[10px]">→</span>
            <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground border-dashed h-5">
              Firmwide
            </Badge>
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2">
        {/* Sources */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sources</span>
          <div className="flex items-center gap-1">
            {sources.answerBank && (
              <span className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                Answer Bank
              </span>
            )}
            {sources.answerBank && sources.supporting && (
              <span className="text-[10px] text-muted-foreground">+</span>
            )}
            {sources.supporting && (
              <span className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                <FileText className="h-3 w-3 text-muted-foreground" />
                Supporting Materials
              </span>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Priority</span>
          <span className="text-[11px] font-medium text-foreground">{priorityLabel}</span>
        </div>

        {/* Verbatim */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Verbatim</span>
          <span className="text-[11px] font-medium text-foreground">{verbatim ? "On" : "Off"}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SearchStrategy() {
  const [layers, setLayers] = useState<StrategyLayer[]>(DEFAULT_LAYERS)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isCustomized, setIsCustomized] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Derive structured preview from layers
  const preview = derivePreviewFromLayers(layers)

  // When advanced editor changes layers, mark customized
  const updateLayer = useCallback((id: string, updatedLayer: StrategyLayer) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? updatedLayer : l)))
    setIsCustomized(true)
  }, [])

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
    setIsCustomized(true)
  }, [])

  const addLayer = () => {
    const newId = String(Date.now())
    setLayers((prev) => [
      ...prev,
      {
        id: newId,
        conditions: [{ field: "Fund", operator: "equals", values: [], exclude: false }],
        groupLogic: "AND" as GroupLogic,
        useAnswerBank: true,
        useSupportingMaterials: true,
        useVerbatim: true,
      },
    ])
    setIsCustomized(true)
  }

  const reset = () => {
    setLayers(DEFAULT_LAYERS)
    setPrompt(DEFAULT_PROMPT)
    setIsCustomized(false)
    setIsAdvancedOpen(false)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) return
    setLayers((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    setDragIndex(null)
    setIsCustomized(true)
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Search Strategy</h3>
        {isCustomized && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* ① Natural-language prompt */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          How should we prioritize answers for this submission?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            setIsCustomized(true)
          }}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors"
          placeholder="Describe how answers should be prioritized…"
        />
      </div>

      {/* ② Interpreted summary */}
      <div className="space-y-1.5">
        <StrategyPreview preview={preview} />
        <p className="text-[11px] text-muted-foreground/60 px-0.5">
          We translate your description into structured search filters.
        </p>
      </div>

      {/* ③ Advanced rules toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setIsAdvancedOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {isAdvancedOpen ? "Hide Advanced Rules" : "View Advanced Rules"}
          {isAdvancedOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {isCustomized && !isAdvancedOpen && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] font-medium">
              Custom Strategy Applied
            </Badge>
          )}
        </button>

        {/* Advanced layer editor */}
        {isAdvancedOpen && (
          <div className="space-y-3">
            <div className="space-y-0">
              {layers.map((layer, index) => (
                <div key={layer.id}>
                  <StrategyRow
                    layer={layer}
                    index={index}
                    onUpdate={updateLayer}
                    onRemove={removeLayer}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    totalRows={layers.length}
                  />
                  {index < layers.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground/40">
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">fallback</span>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Firmwide fallback */}
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <ArrowDown className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">fallback</span>
                  <ArrowDown className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 py-2">
                <span className="text-xs font-medium text-muted-foreground">Firmwide (locked fallback)</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addLayer}
              className="h-9 w-full border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary/30"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Strategy Layer
            </Button>

            {isCustomized && (
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-2">
                <Wand2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Custom Strategy Applied.</span>{" "}
                  Advanced rules override the natural language prompt.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
