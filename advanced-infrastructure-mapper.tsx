"use client"

import type React from "react"
import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Download, Upload, AlertTriangle, Zap, Shield } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface InfrastructureElement {
  id: string
  name: string
  x: number
  y: number
  layer: number
  type: "utility" | "service" | "facility" | "market" | "storage"
  criticality: "low" | "medium" | "high" | "critical"
}

interface Threat {
  id: string
  name: string
  angle: number
  severity: "low" | "medium" | "high" | "critical"
  impactRadius: number
}

interface Connection {
  id: string
  from: string
  to: string
  type: "dependency" | "backup" | "communication" | "supply"
  strength: "weak" | "moderate" | "strong" | "critical"
}

interface Layer {
  id: string
  name: string
  radius: number
  color: string
  opacity: number
}

const defaultLayers: Layer[] = [
  { id: "1", name: "person", radius: 60, color: "#dcfce7", opacity: 0.4 },
  { id: "2", name: "home", radius: 100, color: "#bbf7d0", opacity: 0.4 },
  { id: "3", name: "village", radius: 140, color: "#86efac", opacity: 0.4 },
  { id: "4", name: "town", radius: 180, color: "#4ade80", opacity: 0.4 },
  { id: "5", name: "region", radius: 220, color: "#22c55e", opacity: 0.4 },
  { id: "6", name: "country", radius: 260, color: "#16a34a", opacity: 0.4 },
  { id: "7", name: "world", radius: 300, color: "#15803d", opacity: 0.4 },
]

const defaultThreats: Threat[] = [
  { id: "1", name: "injury", angle: 0, severity: "high", impactRadius: 50 },
  { id: "2", name: "too hot", angle: 60, severity: "medium", impactRadius: 40 },
  { id: "3", name: "too cold", angle: 120, severity: "medium", impactRadius: 40 },
  { id: "4", name: "hunger", angle: 180, severity: "critical", impactRadius: 60 },
  { id: "5", name: "thirst", angle: 240, severity: "critical", impactRadius: 60 },
  { id: "6", name: "illness", angle: 300, severity: "high", impactRadius: 50 },
]

const defaultElements: InfrastructureElement[] = [
  { id: "1", name: "the individual", x: 400, y: 350, layer: 0, type: "facility", criticality: "critical" },
  { id: "2", name: "home", x: 480, y: 320, layer: 2, type: "facility", criticality: "critical" },
  { id: "3", name: "cooking", x: 450, y: 380, layer: 2, type: "service", criticality: "high" },
  { id: "4", name: "heating", x: 480, y: 380, layer: 2, type: "service", criticality: "high" },
  { id: "5", name: "cooling", x: 520, y: 320, layer: 2, type: "service", criticality: "medium" },
  { id: "6", name: "power station", x: 550, y: 350, layer: 3, type: "utility", criticality: "critical" },
  { id: "7", name: "water plant", x: 280, y: 380, layer: 4, type: "utility", criticality: "critical" },
  { id: "8", name: "hospital", x: 320, y: 280, layer: 3, type: "service", criticality: "critical" },
  { id: "9", name: "police", x: 480, y: 220, layer: 3, type: "service", criticality: "high" },
  { id: "10", name: "food shops", x: 400, y: 450, layer: 3, type: "market", criticality: "high" },
]

const defaultConnections: Connection[] = [
  { id: "1", from: "2", to: "6", type: "dependency", strength: "critical" },
  { id: "2", from: "3", to: "6", type: "dependency", strength: "strong" },
  { id: "3", from: "4", to: "6", type: "dependency", strength: "strong" },
  { id: "4", from: "2", to: "7", type: "dependency", strength: "critical" },
]

const threatColors = {
  low: "#fbbf24",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#dc2626",
}

const connectionColors = {
  dependency: "#3b82f6",
  backup: "#10b981",
  communication: "#8b5cf6",
  supply: "#f59e0b",
}

const connectionWidths = {
  weak: 1,
  moderate: 2,
  strong: 3,
  critical: 4,
}

const elementTypeIcons = {
  utility: "⚡",
  service: "🏢",
  facility: "🏠",
  market: "🏪",
  storage: "📦",
}

export default function AdvancedInfrastructureMapper() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers)
  const [threats, setThreats] = useState<Threat[]>(defaultThreats)
  const [elements, setElements] = useState<InfrastructureElement[]>(defaultElements)
  const [connections, setConnections] = useState<Connection[]>(defaultConnections)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectionType, setConnectionType] = useState<Connection["type"]>("dependency")
  const [connectionStrength, setConnectionStrength] = useState<Connection["strength"]>("moderate")
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [showSegments, setShowSegments] = useState(true)
  const [showThreatImpact, setShowThreatImpact] = useState(false)

  // Form states
  const [newElementName, setNewElementName] = useState("")
  const [newElementType, setNewElementType] = useState<InfrastructureElement["type"]>("facility")
  const [newElementCriticality, setNewElementCriticality] = useState<InfrastructureElement["criticality"]>("medium")
  const [newThreatName, setNewThreatName] = useState("")
  const [newThreatSeverity, setNewThreatSeverity] = useState<Threat["severity"]>("medium")
  const [newLayerName, setNewLayerName] = useState("")

  const svgRef = useRef<SVGSVGElement>(null)
  const centerX = 400
  const centerY = 350
  const maxRadius = 320

  // Calculate dynamic threat segments
  const threatSegments = useMemo(() => {
    if (threats.length === 0) return []

    const sortedThreats = [...threats].sort((a, b) => a.angle - b.angle)
    const segments = []

    for (let i = 0; i < sortedThreats.length; i++) {
      const currentThreat = sortedThreats[i]
      const nextThreat = sortedThreats[(i + 1) % sortedThreats.length]

      const startAngle = currentThreat.angle
      let endAngle = nextThreat.angle

      // Handle wrap-around
      if (endAngle < startAngle) {
        endAngle += 360
      }

      segments.push({
        startAngle,
        endAngle,
        threat: currentThreat,
      })
    }

    return segments
  }, [threats])

  const handleElementClick = (elementId: string) => {
    if (connectingFrom && connectingFrom !== elementId) {
      const newConnection: Connection = {
        id: `${connectingFrom}-${elementId}-${Date.now()}`,
        from: connectingFrom,
        to: elementId,
        type: connectionType,
        strength: connectionStrength,
      }
      setConnections((prev) => [...prev, newConnection])
      setConnectingFrom(null)
    } else {
      setSelectedElement(elementId)
      setConnectingFrom(elementId)
    }
  }

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggedElement(elementId)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedElement && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setElements((prev) => prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el)))
      }
    },
    [draggedElement],
  )

  const handleMouseUp = () => {
    setDraggedElement(null)
  }

  const addElement = () => {
    if (newElementName.trim()) {
      const newElement: InfrastructureElement = {
        id: Date.now().toString(),
        name: newElementName.trim(),
        x: centerX + Math.random() * 100 - 50,
        y: centerY + Math.random() * 100 - 50,
        layer: 2,
        type: newElementType,
        criticality: newElementCriticality,
      }
      setElements((prev) => [...prev, newElement])
      setNewElementName("")
    }
  }

  const addThreat = () => {
    if (newThreatName.trim()) {
      // Find a good angle that doesn't overlap too much
      const existingAngles = threats.map((t) => t.angle)
      let newAngle = Math.random() * 360

      // Try to find an angle with good spacing
      for (let attempt = 0; attempt < 10; attempt++) {
        const testAngle = (attempt * 36) % 360
        const minDistance = Math.min(...existingAngles.map((a) => Math.abs(testAngle - a)))
        if (minDistance > 30) {
          newAngle = testAngle
          break
        }
      }

      const newThreat: Threat = {
        id: Date.now().toString(),
        name: newThreatName.trim(),
        angle: newAngle,
        severity: newThreatSeverity,
        impactRadius: newThreatSeverity === "critical" ? 60 : newThreatSeverity === "high" ? 50 : 40,
      }
      setThreats((prev) => [...prev, newThreat])
      setNewThreatName("")
    }
  }

  const addLayer = () => {
    if (newLayerName.trim()) {
      const maxRadius = Math.max(...layers.map((l) => l.radius))
      const newLayer: Layer = {
        id: Date.now().toString(),
        name: newLayerName.trim(),
        radius: maxRadius + 40,
        color: "#10b981",
        opacity: 0.3,
      }
      setLayers((prev) => [...prev, newLayer])
      setNewLayerName("")
    }
  }

  const deleteElement = (elementId: string) => {
    setElements((prev) => prev.filter((el) => el.id !== elementId))
    setConnections((prev) => prev.filter((conn) => conn.from !== elementId && conn.to !== elementId))
    setSelectedElement(null)
  }

  const deleteThreat = (threatId: string) => {
    setThreats((prev) => prev.filter((t) => t.id !== threatId))
  }

  const deleteLayer = (layerId: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== layerId))
  }

  const deleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
  }

  const exportData = () => {
    const data = { layers, threats, elements, connections }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "infrastructure-map.json"
    a.click()
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.layers) setLayers(data.layers)
          if (data.threats) setThreats(data.threats)
          if (data.elements) setElements(data.elements)
          if (data.connections) setConnections(data.connections)
        } catch (error) {
          alert("Error importing file")
        }
      }
      reader.readAsText(file)
    }
  }

  const getThreatPosition = (angle: number, radius = maxRadius + 20) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: centerX + Math.cos(radian) * radius,
      y: centerY + Math.sin(radian) * radius,
    }
  }

  const createSegmentPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = centerX + Math.cos(startRad) * innerRadius
    const y1 = centerY + Math.sin(startRad) * innerRadius
    const x2 = centerX + Math.cos(endRad) * innerRadius
    const y2 = centerY + Math.sin(endRad) * innerRadius
    const x3 = centerX + Math.cos(endRad) * outerRadius
    const y3 = centerY + Math.sin(endRad) * outerRadius
    const x4 = centerX + Math.cos(startRad) * outerRadius
    const y4 = centerY + Math.sin(startRad) * outerRadius

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
  }

  return (
    <div className="w-full h-screen flex bg-gray-50">
      <div className="flex-1">
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h1 className="text-xl font-bold">Critical Infrastructure Mapper</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSegments(!showSegments)}
              variant={showSegments ? "default" : "outline"}
              size="sm"
            >
              Segments
            </Button>
            <Button
              onClick={() => setShowThreatImpact(!showThreatImpact)}
              variant={showThreatImpact ? "default" : "outline"}
              size="sm"
            >
              Impact Zones
            </Button>
            <Button onClick={exportData} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </span>
              </Button>
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        <svg
          ref={svgRef}
          width="800"
          height="700"
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => {
            setSelectedElement(null)
            setConnectingFrom(null)
          }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Threat segments */}
          {showSegments &&
            threatSegments.map((segment, index) => (
              <g key={`segment-${index}`}>
                <path
                  d={createSegmentPath(segment.startAngle, segment.endAngle, 0, maxRadius)}
                  fill={threatColors[segment.threat.severity]}
                  fillOpacity={0.1}
                  stroke={threatColors[segment.threat.severity]}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                />
                {/* Radial lines */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + Math.cos((segment.startAngle * Math.PI) / 180) * maxRadius}
                  y2={centerY + Math.sin((segment.startAngle * Math.PI) / 180) * maxRadius}
                  stroke="#374151"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
              </g>
            ))}

          {/* Concentric circles for layers */}
          {layers.map((layer) => (
            <circle
              key={layer.id}
              cx={centerX}
              cy={centerY}
              r={layer.radius}
              fill={layer.color}
              fillOpacity={layer.opacity}
              stroke="#374151"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          ))}

          {/* Layer labels */}
          {layers.map((layer) => (
            <text
              key={`label-${layer.id}`}
              x={centerX}
              y={centerY - layer.radius + 15}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700"
            >
              {layer.name}
            </text>
          ))}

          {/* Threat impact zones */}
          {showThreatImpact &&
            threats.map((threat) => {
              const pos = getThreatPosition(threat.angle, maxRadius - threat.impactRadius)
              return (
                <circle
                  key={`impact-${threat.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={threat.impactRadius}
                  fill={threatColors[threat.severity]}
                  fillOpacity={0.15}
                  stroke={threatColors[threat.severity]}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  strokeDasharray="5,5"
                />
              )
            })}

          {/* Threats around the perimeter */}
          {threats.map((threat) => {
            const pos = getThreatPosition(threat.angle)
            return (
              <g key={threat.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={20}
                  fill={threatColors[threat.severity]}
                  fillOpacity={0.2}
                  stroke={threatColors[threat.severity]}
                  strokeWidth={2}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="text-sm font-bold fill-gray-800">
                  {threat.name}
                </text>
              </g>
            )
          })}

          {/* Connections */}
          {connections.map((connection) => {
            const fromElement = elements.find((el) => el.id === connection.from)
            const toElement = elements.find((el) => el.id === connection.to)
            if (!fromElement || !toElement) return null

            return (
              <line
                key={connection.id}
                x1={fromElement.x}
                y1={fromElement.y}
                x2={toElement.x}
                y2={toElement.y}
                stroke={connectionColors[connection.type]}
                strokeWidth={connectionWidths[connection.strength]}
                className="cursor-pointer hover:opacity-50"
                strokeDasharray={connection.type === "backup" ? "5,5" : "none"}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConnection(connection.id)
                }}
              />
            )
          })}

          {/* Infrastructure elements */}
          {elements.map((element) => {
            const isSelected = selectedElement === element.id
            const isConnecting = connectingFrom === element.id

            return (
              <g key={element.id}>
                <rect
                  x={element.x - 35}
                  y={element.y - 15}
                  width={70}
                  height={30}
                  rx={6}
                  fill="white"
                  stroke={
                    isSelected
                      ? "#ef4444"
                      : isConnecting
                        ? "#3b82f6"
                        : element.criticality === "critical"
                          ? "#dc2626"
                          : element.criticality === "high"
                            ? "#ea580c"
                            : element.criticality === "medium"
                              ? "#ca8a04"
                              : "#65a30d"
                  }
                  strokeWidth={isSelected || isConnecting ? 3 : 2}
                  className="cursor-move hover:stroke-blue-500"
                  filter={element.criticality === "critical" ? "url(#glow)" : "none"}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleElementClick(element.id)
                  }}
                />
                <text
                  x={element.x - 30}
                  y={element.y - 2}
                  className="text-xs font-medium fill-gray-800 pointer-events-none"
                >
                  {elementTypeIcons[element.type]}
                </text>
                <text
                  x={element.x - 10}
                  y={element.y + 4}
                  className="text-xs font-medium fill-gray-800 pointer-events-none"
                >
                  {element.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="grid w-full grid-cols-4 m-2">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="connections">Links</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="elements" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Infrastructure Element
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Element name"
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addElement()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newElementType}
                        onValueChange={(value: InfrastructureElement["type"]) => setNewElementType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utility">⚡ Utility</SelectItem>
                          <SelectItem value="service">🏢 Service</SelectItem>
                          <SelectItem value="facility">🏠 Facility</SelectItem>
                          <SelectItem value="market">🏪 Market</SelectItem>
                          <SelectItem value="storage">📦 Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Criticality</Label>
                      <Select
                        value={newElementCriticality}
                        onValueChange={(value: InfrastructureElement["criticality"]) => setNewElementCriticality(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addElement} size="sm" className="w-full">
                    Add Element
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Infrastructure Elements</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 rounded border ${
                        selectedElement === element.id ? "border-red-500 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">{elementTypeIcons[element.type]}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{element.name}</div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {element.type}
                            </Badge>
                            <Badge
                              variant={element.criticality === "critical" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {element.criticality}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => deleteElement(element.id)} size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {connectingFrom && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-3">
                    <div className="text-sm text-blue-800 mb-2">Creating Connection</div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Connection Type</Label>
                        <Select
                          value={connectionType}
                          onValueChange={(value: Connection["type"]) => setConnectionType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dependency">Dependency</SelectItem>
                            <SelectItem value="backup">Backup</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="supply">Supply</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Strength</Label>
                        <Select
                          value={connectionStrength}
                          onValueChange={(value: Connection["strength"]) => setConnectionStrength(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weak">Weak</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="strong">Strong</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Click another element to create connection</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="threats" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Add Threat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Threat name"
                      value={newThreatName}
                      onChange={(e) => setNewThreatName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addThreat()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Select
                      value={newThreatSeverity}
                      onValueChange={(value: Threat["severity"]) => setNewThreatSeverity(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addThreat} size="sm" className="w-full">
                    Add Threat
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">External Threats</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {threats.map((threat) => (
                    <div
                      key={threat.id}
                      className="flex items-center justify-between p-2 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{threat.name}</div>
                        <div className="flex gap-1">
                          <Badge
                            style={{ backgroundColor: threatColors[threat.severity] }}
                            className="text-xs text-white"
                          >
                            {threat.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(threat.angle)}°
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={() => deleteThreat(threat.id)} size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layers" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Add Layer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Layer name"
                      value={newLayerName}
                      onChange={(e) => setNewLayerName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addLayer()}
                    />
                  </div>
                  <Button onClick={addLayer} size="sm" className="w-full">
                    Add Layer
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Distance Layers</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: layer.color }} />
                        <div>
                          <div className="text-sm font-medium">{layer.name}</div>
                          <div className="text-xs text-gray-500">Radius: {layer.radius}px</div>
                        </div>
                      </div>
                      <Button onClick={() => deleteLayer(layer.id)} size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Infrastructure Connections
                </Label>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {connections.map((connection) => {
                    const fromElement = elements.find((el) => el.id === connection.from)
                    const toElement = elements.find((el) => el.id === connection.to)

                    return (
                      <div key={connection.id} className="p-2 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {fromElement?.name} → {toElement?.name}
                            </div>
                            <div className="flex gap-1 mt-1">
                              <Badge
                                style={{ backgroundColor: connectionColors[connection.type] }}
                                className="text-xs text-white"
                              >
                                {connection.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {connection.strength}
                              </Badge>
                            </div>
                          </div>
                          <Button onClick={() => deleteConnection(connection.id)} size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Connection Legend</Label>
                <div className="space-y-1 text-xs">
                  {Object.entries(connectionColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructions</Label>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Drag elements to reposition them</p>
              <p>• Click an element to start connecting</p>
              <p>• Set connection type before linking</p>
              <p>• Click connections to delete them</p>
              <p>• Threats auto-create map segments</p>
              <p>• Toggle segments and impact zones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
