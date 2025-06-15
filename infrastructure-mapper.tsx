"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Download, Upload } from "lucide-react"

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
}

interface Threat {
  id: string
  name: string
  angle: number
}

interface Connection {
  id: string
  from: string
  to: string
}

interface Layer {
  id: string
  name: string
  radius: number
  color: string
}

const defaultLayers: Layer[] = [
  { id: "1", name: "person", radius: 60, color: "#dcfce7" },
  { id: "2", name: "home", radius: 100, color: "#bbf7d0" },
  { id: "3", name: "village", radius: 140, color: "#86efac" },
  { id: "4", name: "town", radius: 180, color: "#4ade80" },
  { id: "5", name: "region", radius: 220, color: "#22c55e" },
  { id: "6", name: "country", radius: 260, color: "#16a34a" },
  { id: "7", name: "world", radius: 300, color: "#15803d" },
]

const defaultThreats: Threat[] = [
  { id: "1", name: "injury", angle: 0 },
  { id: "2", name: "too hot", angle: 60 },
  { id: "3", name: "too cold", angle: 120 },
  { id: "4", name: "hunger", angle: 180 },
  { id: "5", name: "thirst", angle: 240 },
  { id: "6", name: "illness", angle: 300 },
]

const defaultElements: InfrastructureElement[] = [
  { id: "1", name: "the individual", x: 400, y: 350, layer: 0 },
  { id: "2", name: "home", x: 480, y: 320, layer: 2 },
  { id: "3", name: "cooking", x: 450, y: 380, layer: 2 },
  { id: "4", name: "heating", x: 480, y: 380, layer: 2 },
  { id: "5", name: "cooling", x: 520, y: 320, layer: 2 },
  { id: "6", name: "power station", x: 550, y: 350, layer: 3 },
  { id: "7", name: "water plant", x: 280, y: 380, layer: 4 },
  { id: "8", name: "hospital", x: 320, y: 280, layer: 3 },
  { id: "9", name: "police", x: 480, y: 220, layer: 3 },
  { id: "10", name: "food shops", x: 400, y: 450, layer: 3 },
]

export default function InfrastructureMapper() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers)
  const [threats, setThreats] = useState<Threat[]>(defaultThreats)
  const [elements, setElements] = useState<InfrastructureElement[]>(defaultElements)
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [newElementName, setNewElementName] = useState("")
  const [newThreatName, setNewThreatName] = useState("")
  const [newLayerName, setNewLayerName] = useState("")

  const svgRef = useRef<SVGSVGElement>(null)
  const centerX = 400
  const centerY = 350

  const handleElementClick = (elementId: string) => {
    if (connectingFrom && connectingFrom !== elementId) {
      const newConnection: Connection = {
        id: `${connectingFrom}-${elementId}`,
        from: connectingFrom,
        to: elementId,
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
      }
      setElements((prev) => [...prev, newElement])
      setNewElementName("")
    }
  }

  const addThreat = () => {
    if (newThreatName.trim()) {
      const newThreat: Threat = {
        id: Date.now().toString(),
        name: newThreatName.trim(),
        angle: Math.random() * 360,
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

  const getThreatPosition = (angle: number, radius = 340) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: centerX + Math.cos(radian) * radius,
      y: centerY + Math.sin(radian) * radius,
    }
  }

  return (
    <div className="w-full h-screen flex">
      <div className="flex-1 bg-gray-50">
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
          {/* Concentric circles for layers */}
          {layers.map((layer) => (
            <circle
              key={layer.id}
              cx={centerX}
              cy={centerY}
              r={layer.radius}
              fill={layer.color}
              fillOpacity={0.3}
              stroke="#374151"
              strokeWidth={1}
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

          {/* Threats around the perimeter */}
          {threats.map((threat) => {
            const pos = getThreatPosition(threat.angle)
            return (
              <text
                key={threat.id}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                className="text-lg font-bold fill-red-600"
                transform={`rotate(${threat.angle}, ${pos.x}, ${pos.y})`}
              >
                {threat.name}
              </text>
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
                stroke="#6b7280"
                strokeWidth={2}
                className="cursor-pointer hover:stroke-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConnection(connection.id)
                }}
              />
            )
          })}

          {/* Infrastructure elements */}
          {elements.map((element) => (
            <g key={element.id}>
              <rect
                x={element.x - 30}
                y={element.y - 12}
                width={60}
                height={24}
                rx={4}
                fill="white"
                stroke={selectedElement === element.id ? "#ef4444" : "#374151"}
                strokeWidth={selectedElement === element.id ? 2 : 1}
                className="cursor-move hover:stroke-blue-500"
                onMouseDown={(e) => handleMouseDown(element.id, e)}
                onClick={(e) => {
                  e.stopPropagation()
                  handleElementClick(element.id)
                }}
              />
              <text
                x={element.x}
                y={element.y + 4}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-800 pointer-events-none"
              >
                {element.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex gap-2">
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

          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="threats">Threats</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Infrastructure Element</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Element name"
                    value={newElementName}
                    onChange={(e) => setNewElementName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addElement()}
                  />
                  <Button onClick={addElement} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Element
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Infrastructure Elements</Label>
                {elements.map((element) => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      selectedElement === element.id ? "border-red-500 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <span className="text-sm">{element.name}</span>
                    <Button onClick={() => deleteElement(element.id)} size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {connectingFrom && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">Click another element to create a connection</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="threats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Threat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Threat name"
                    value={newThreatName}
                    onChange={(e) => setNewThreatName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addThreat()}
                  />
                  <Button onClick={addThreat} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Threat
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">External Threats</Label>
                {threats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-sm">{threat.name}</span>
                    <Button onClick={() => deleteThreat(threat.id)} size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Layer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Layer name"
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLayer()}
                  />
                  <Button onClick={addLayer} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Layer
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Distance Layers</Label>
                {layers.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: layer.color }} />
                      <span className="text-sm">{layer.name}</span>
                    </div>
                    <Button onClick={() => deleteLayer(layer.id)} size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructions</Label>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Drag elements to reposition them</p>
              <p>• Click an element to start connecting</p>
              <p>• Click another element to create a connection</p>
              <p>• Click connections to delete them</p>
              <p>• Use Export/Import to save your work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
