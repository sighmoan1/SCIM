"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Trash2,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Zap,
  Shield,
  Menu,
  X,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface InfrastructureElement {
  id: string;
  name: string;
  x: number;
  y: number;
  layer: number;
  width?: number;
  height?: number;
}

interface Threat {
  id: string;
  name: string;
  angle: number;
  impactRadius: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface Layer {
  id: string;
  name: string;
  radius: number;
  color: string;
  opacity: number;
}

const defaultLayers: Layer[] = [
  { id: "1", name: "person", radius: 60, color: "#dcfce7", opacity: 0.4 },
  { id: "2", name: "home", radius: 100, color: "#bbf7d0", opacity: 0.4 },
  { id: "3", name: "village", radius: 140, color: "#86efac", opacity: 0.4 },
  { id: "4", name: "town", radius: 180, color: "#4ade80", opacity: 0.4 },
  { id: "5", name: "region", radius: 220, color: "#22c55e", opacity: 0.4 },
  { id: "6", name: "country", radius: 260, color: "#16a34a", opacity: 0.4 },
  { id: "7", name: "world", radius: 300, color: "#15803d", opacity: 0.4 },
];

const defaultThreats: Threat[] = [
  { id: "1", name: "injury", angle: 0, impactRadius: 50 },
  { id: "2", name: "too hot", angle: 60, impactRadius: 40 },
  {
    id: "3",
    name: "too cold",
    angle: 120,
    impactRadius: 40,
  },
  {
    id: "4",
    name: "hunger",
    angle: 180,
    impactRadius: 60,
  },
  {
    id: "5",
    name: "thirst",
    angle: 240,
    impactRadius: 60,
  },
  { id: "6", name: "illness", angle: 300, impactRadius: 50 },
];

const defaultElements: InfrastructureElement[] = [
  {
    id: "1",
    name: "the individual",
    x: 450,
    y: 400,
    layer: 0,
    width: 80,
    height: 30,
  },
  {
    id: "2",
    name: "home",
    x: 530,
    y: 370,
    layer: 2,
    width: 60,
    height: 30,
  },
  {
    id: "3",
    name: "cooking",
    x: 500,
    y: 430,
    layer: 2,
    width: 60,
    height: 30,
  },
  {
    id: "4",
    name: "heating",
    x: 530,
    y: 430,
    layer: 2,
    width: 60,
    height: 30,
  },
  {
    id: "5",
    name: "cooling",
    x: 570,
    y: 370,
    layer: 2,
    width: 60,
    height: 30,
  },
  {
    id: "6",
    name: "power station",
    x: 600,
    y: 400,
    layer: 3,
    width: 80,
    height: 30,
  },
  {
    id: "7",
    name: "water plant",
    x: 330,
    y: 430,
    layer: 4,
    width: 80,
    height: 30,
  },
  {
    id: "8",
    name: "hospital",
    x: 370,
    y: 330,
    layer: 3,
    width: 70,
    height: 30,
  },
  {
    id: "9",
    name: "police",
    x: 530,
    y: 270,
    layer: 3,
    width: 60,
    height: 30,
  },
  {
    id: "10",
    name: "food shops",
    x: 450,
    y: 500,
    layer: 3,
    width: 80,
    height: 30,
  },
];

const defaultConnections: Connection[] = [
  { id: "1", from: "2", to: "6" },
  { id: "2", from: "3", to: "6" },
  { id: "3", from: "4", to: "6" },
  { id: "4", from: "2", to: "7" },
];

const connectionColors = {
  dependency: "#3b82f6",
  backup: "#10b981",
  communication: "#8b5cf6",
  supply: "#f59e0b",
};

export default function AdvancedInfrastructureMapper() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [threats, setThreats] = useState<Threat[]>(defaultThreats);
  const [elements, setElements] =
    useState<InfrastructureElement[]>(defaultElements);
  const [connections, setConnections] =
    useState<Connection[]>(defaultConnections);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showSegments, setShowSegments] = useState(true);
  const [showThreatImpact, setShowThreatImpact] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("elements");
  const [svgDimensions, setSvgDimensions] = useState({
    width: 900,
    height: 800,
  });
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Form states
  const [newElementName, setNewElementName] = useState("");
  const [newThreatName, setNewThreatName] = useState("");
  const [newLayerName, setNewLayerName] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive SVG calculations
  const centerX = svgDimensions.width / 2;
  const centerY = svgDimensions.height / 2;
  const maxRadius = Math.min(svgDimensions.width, svgDimensions.height) * 0.3;

  // Update SVG dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(400, rect.width);
        const height = Math.max(300, rect.height);
        setSvgDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Scale elements to new dimensions
  const scaledElements = useMemo(() => {
    const scaleX = svgDimensions.width / 900;
    const scaleY = svgDimensions.height / 800;
    return elements.map((element) => ({
      ...element,
      x: (element.x - 450) * scaleX + centerX,
      y: (element.y - 400) * scaleY + centerY,
    }));
  }, [elements, svgDimensions, centerX, centerY]);

  // Scale layers to new dimensions
  const scaledLayers = useMemo(() => {
    const scale = Math.min(svgDimensions.width, svgDimensions.height) / 800;
    return layers.map((layer) => ({
      ...layer,
      radius: layer.radius * scale,
    }));
  }, [layers, svgDimensions]);

  // Calculate the actual maximum layer radius
  const actualMaxRadius = useMemo(() => {
    if (scaledLayers.length === 0) return maxRadius;
    return Math.max(...scaledLayers.map((layer) => layer.radius));
  }, [scaledLayers, maxRadius]);

  // Calculate dynamic threat segments
  const threatSegments = useMemo(() => {
    if (threats.length === 0) return [];

    const sortedThreats = [...threats].sort((a, b) => a.angle - b.angle);
    const segments = [];

    for (let i = 0; i < sortedThreats.length; i++) {
      const currentThreat = sortedThreats[i];
      const nextThreat = sortedThreats[(i + 1) % sortedThreats.length];

      const startAngle = currentThreat.angle;
      let endAngle = nextThreat.angle;

      // Handle wrap-around
      if (endAngle < startAngle) {
        endAngle += 360;
      }

      segments.push({
        startAngle,
        endAngle,
        threat: currentThreat,
      });
    }

    return segments;
  }, [threats]);

  const handleElementClick = (elementId: string) => {
    if (connectingFrom && connectingFrom !== elementId) {
      const newConnection: Connection = {
        id: `${connectingFrom}-${elementId}-${Date.now()}`,
        from: connectingFrom,
        to: elementId,
      };
      setConnections((prev) => [...prev, newConnection]);
      setConnectingFrom(null);
    } else {
      setSelectedElement(elementId);
      setConnectingFrom(elementId);
    }
  };

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();

      // Get mouse position in SVG coordinate system (accounting for viewBox)
      const mouseX =
        (e.clientX - rect.left) * (svgDimensions.width / rect.width);
      const mouseY =
        (e.clientY - rect.top) * (svgDimensions.height / rect.height);

      // Find the element in the original elements array (not scaled)
      const element = elements.find((el) => el.id === elementId);
      const scaledElement = scaledElements.find((el) => el.id === elementId);

      if (element && scaledElement) {
        // Calculate the offset between mouse position and scaled element position
        const offsetX = mouseX - scaledElement.x;
        const offsetY = mouseY - scaledElement.y;
        setDragOffset({ x: offsetX, y: offsetY });
      }
    }

    setDraggedElement(elementId);
  };

  const handleResizeMouseDown = (
    elementId: string,
    handle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setResizingElement(elementId);
    setResizeHandle(handle);
  };

  const handleResize = useCallback(
    (e: React.MouseEvent) => {
      if (resizingElement && resizeHandle && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX =
          (e.clientX - rect.left) * (svgDimensions.width / rect.width);
        const mouseY =
          (e.clientY - rect.top) * (svgDimensions.height / rect.height);

        setElements((prev) =>
          prev.map((el) => {
            if (el.id === resizingElement) {
              const currentWidth = el.width || 80;
              const currentHeight = el.height || 30;
              let newWidth = currentWidth;
              let newHeight = currentHeight;

              const scaledElement = scaledElements.find(
                (se) => se.id === el.id
              );
              if (!scaledElement) return el;

              switch (resizeHandle) {
                case "se": // Southeast corner
                  newWidth = Math.max(
                    40,
                    mouseX - scaledElement.x + currentWidth / 2
                  );
                  newHeight = Math.max(
                    20,
                    mouseY - scaledElement.y + currentHeight / 2
                  );
                  break;
                case "sw": // Southwest corner
                  newWidth = Math.max(
                    40,
                    scaledElement.x - mouseX + currentWidth / 2
                  );
                  newHeight = Math.max(
                    20,
                    mouseY - scaledElement.y + currentHeight / 2
                  );
                  break;
                case "ne": // Northeast corner
                  newWidth = Math.max(
                    40,
                    mouseX - scaledElement.x + currentWidth / 2
                  );
                  newHeight = Math.max(
                    20,
                    scaledElement.y - mouseY + currentHeight / 2
                  );
                  break;
                case "nw": // Northwest corner
                  newWidth = Math.max(
                    40,
                    scaledElement.x - mouseX + currentWidth / 2
                  );
                  newHeight = Math.max(
                    20,
                    scaledElement.y - mouseY + currentHeight / 2
                  );
                  break;
              }

              return { ...el, width: newWidth, height: newHeight };
            }
            return el;
          })
        );
      }
    },
    [resizingElement, resizeHandle, svgDimensions, scaledElements]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (resizingElement) {
        handleResize(e);
      } else if (draggedElement && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();

        // Get mouse position in SVG coordinate system (accounting for viewBox)
        const mouseX =
          (e.clientX - rect.left) * (svgDimensions.width / rect.width);
        const mouseY =
          (e.clientY - rect.top) * (svgDimensions.height / rect.height);

        // Apply the offset to maintain the element's position relative to where the user clicked
        const scaledX = mouseX - dragOffset.x;
        const scaledY = mouseY - dragOffset.y;

        // Convert back to original coordinate system (reverse the scaling)
        const scaleX = svgDimensions.width / 900;
        const scaleY = svgDimensions.height / 800;

        const originalX = (scaledX - centerX) / scaleX + 450;
        const originalY = (scaledY - centerY) / scaleY + 400;

        setElements((prev) =>
          prev.map((el) =>
            el.id === draggedElement
              ? {
                  ...el,
                  x: originalX,
                  y: originalY,
                }
              : el
          )
        );
      }
    },
    [
      draggedElement,
      resizingElement,
      svgDimensions,
      dragOffset,
      centerX,
      centerY,
      scaledElements,
      handleResize,
    ]
  );

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizingElement(null);
    setResizeHandle(null);
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize = 10) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    // Approximate character width based on font size
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);

    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const addElement = () => {
    if (!newElementName.trim()) return;

    const newElement: InfrastructureElement = {
      id: Date.now().toString(),
      name: newElementName,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
      layer: 1,
      width: 80,
      height: 30,
    };

    setElements((prev) => [...prev, newElement]);
    setNewElementName("");
  };

  const addThreat = () => {
    if (!newThreatName.trim()) return;

    // Find an available angle
    const usedAngles = threats.map((t) => t.angle);
    let angle = 0;
    while (usedAngles.includes(angle)) {
      angle += 15;
      if (angle >= 360) angle = Math.random() * 360;
    }

    const newThreat: Threat = {
      id: Date.now().toString(),
      name: newThreatName,
      angle,
      impactRadius: 50,
    };

    setThreats((prev) => [...prev, newThreat]);
    setNewThreatName("");
  };

  const addLayer = () => {
    if (!newLayerName.trim()) return;

    const maxCurrentRadius =
      layers.length > 0 ? Math.max(...layers.map((l) => l.radius)) : 0;
    const newRadius = maxCurrentRadius + 40;

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: newLayerName,
      radius: newRadius,
      color: `hsl(${Math.random() * 360}, 50%, 70%)`,
      opacity: 0.4,
    };

    setLayers((prev) => [...prev, newLayer]);
    setNewLayerName("");
  };

  const deleteElement = (elementId: string) => {
    setElements((prev) => prev.filter((el) => el.id !== elementId));
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== elementId && conn.to !== elementId)
    );
  };

  const deleteThreat = (threatId: string) => {
    setThreats((prev) => prev.filter((threat) => threat.id !== threatId));
  };

  const deleteLayer = (layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
  };

  const deleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
  };

  const exportData = () => {
    const data = { layers, threats, elements, connections };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "infrastructure-map.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.layers) setLayers(data.layers);
        if (data.threats) setThreats(data.threats);
        if (data.elements) setElements(data.elements);
        if (data.connections) setConnections(data.connections);
      } catch (error) {
        console.error("Failed to import data:", error);
      }
    };
    reader.readAsText(file);
  };

  const getThreatPosition = (angle: number, radius = actualMaxRadius + 30) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
    };
  };

  // Get position for segment label (outside the largest layer)
  const getSegmentLabelPosition = (
    startAngle: number,
    endAngle: number,
    radius = actualMaxRadius + 50
  ) => {
    // Calculate the middle angle of the segment
    let middleAngle = (startAngle + endAngle) / 2;

    // Handle wrap-around case
    if (endAngle < startAngle) {
      middleAngle = ((startAngle + endAngle + 360) / 2) % 360;
    }

    const radians = (middleAngle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
      angle: middleAngle,
    };
  };

  const createSegmentPath = (
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number
  ) => {
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;

    const x1 = centerX + Math.cos(startRadians) * innerRadius;
    const y1 = centerY + Math.sin(startRadians) * innerRadius;
    const x2 = centerX + Math.cos(endRadians) * innerRadius;
    const y2 = centerY + Math.sin(endRadians) * innerRadius;

    const x3 = centerX + Math.cos(endRadians) * outerRadius;
    const y3 = centerY + Math.sin(endRadians) * outerRadius;
    const x4 = centerX + Math.cos(startRadians) * outerRadius;
    const y4 = centerY + Math.sin(startRadians) * outerRadius;

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  // Mobile Control Panel Component
  const ControlPanel = () => (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-4 mx-2 mt-2">
          <TabsTrigger value="elements" className="text-xs">
            Elements
          </TabsTrigger>
          <TabsTrigger value="threats" className="text-xs">
            Threats
          </TabsTrigger>
          <TabsTrigger value="layers" className="text-xs">
            Layers
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-xs">
            Links
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
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
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        addElement();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </div>

                <Button onClick={addElement} size="sm" className="w-full">
                  Add Element
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Infrastructure Elements
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scaledElements.map((element) => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      selectedElement === element.id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {element.name}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteElement(element.id);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {connectingFrom && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="text-sm text-blue-800 mb-2">
                    Creating Connection
                  </div>

                  <p className="text-xs text-blue-600 mt-2">
                    Click another element to create connection
                  </p>
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
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        addThreat();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                  />
                </div>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addThreat();
                  }}
                  size="sm"
                  className="w-full"
                >
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
                        <Badge variant="outline" className="text-xs">
                          {Math.round(threat.angle)}°
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteThreat(threat.id);
                      }}
                      size="sm"
                      variant="ghost"
                    >
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
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        addLayer();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
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
                {scaledLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between p-2 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div>
                        <div className="text-sm font-medium">{layer.name}</div>
                        <div className="text-xs text-gray-500">
                          Radius: {Math.round(layer.radius)}px
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteLayer(layer.id);
                      }}
                      size="sm"
                      variant="ghost"
                    >
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
                  const fromElement = scaledElements.find(
                    (el) => el.id === connection.from
                  );
                  const toElement = scaledElements.find(
                    (el) => el.id === connection.to
                  );

                  return (
                    <div
                      key={connection.id}
                      className="p-2 rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {fromElement?.name} → {toElement?.name}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge
                              style={{
                                backgroundColor:
                                  connectionColors[connection.type],
                              }}
                              className="text-xs text-white"
                            >
                              {connection.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {connection.strength}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteConnection(connection.id);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </div>

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
      </Tabs>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="p-2 sm:p-4 border-b bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Controls</h2>
                </div>
                <ControlPanel />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg sm:text-xl font-bold">
              Critical Infrastructure Mapper
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowSegments(!showSegments)}
              variant={showSegments ? "default" : "outline"}
              size="sm"
            >
              <span className="hidden sm:inline">Segments</span>
              <span className="sm:hidden">Seg</span>
            </Button>
            <Button
              onClick={() => setShowThreatImpact(!showThreatImpact)}
              variant={showThreatImpact ? "default" : "outline"}
              size="sm"
            >
              <span className="hidden sm:inline">Impact Zones</span>
              <span className="sm:hidden">Impact</span>
            </Button>
            <Button onClick={exportData} size="sm" variant="outline">
              <Download className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Import</span>
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* SVG Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <svg
            ref={svgRef}
            width={svgDimensions.width}
            height={svgDimensions.height}
            className="w-full h-full cursor-crosshair"
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => {
              setSelectedElement(null);
              setConnectingFrom(null);
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
              threatSegments.map((segment, index) => {
                const labelPos = getSegmentLabelPosition(
                  segment.startAngle,
                  segment.endAngle
                );
                return (
                  <g key={`segment-${index}`}>
                    <path
                      d={createSegmentPath(
                        segment.startAngle,
                        segment.endAngle,
                        0,
                        actualMaxRadius
                      )}
                      fill="#ef4444"
                      fillOpacity={0.1}
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeOpacity={0.3}
                    />
                    {/* Radial lines */}
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={
                        centerX +
                        Math.cos((segment.startAngle * Math.PI) / 180) *
                          actualMaxRadius
                      }
                      y2={
                        centerY +
                        Math.sin((segment.startAngle * Math.PI) / 180) *
                          actualMaxRadius
                      }
                      stroke="#374151"
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    />
                    {/* Segment label */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-sm font-bold fill-gray-900 pointer-events-none select-none"
                      style={{
                        textShadow: "2px 2px 4px rgba(255,255,255,0.9)",
                        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))",
                        userSelect: "none",
                      }}
                    >
                      {segment.threat.name}
                    </text>
                  </g>
                );
              })}

            {/* Concentric circles for layers */}
            {scaledLayers.map((layer) => (
              <circle
                key={layer.id}
                cx={centerX}
                cy={centerY}
                r={layer.radius}
                fill="none"
                stroke="#374151"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            ))}

            {/* Layer labels */}
            {scaledLayers.map((layer) => (
              <text
                key={`label-${layer.id}`}
                x={centerX}
                y={centerY - layer.radius + 15}
                textAnchor="middle"
                className="text-xs sm:text-sm font-medium fill-gray-700 pointer-events-none select-none"
                style={{ userSelect: "none" }}
              >
                {layer.name}
              </text>
            ))}

            {/* Threat impact zones */}
            {showThreatImpact &&
              threats.map((threat) => {
                const scale =
                  Math.min(svgDimensions.width, svgDimensions.height) / 800;
                const scaledImpactRadius = threat.impactRadius * scale;
                const pos = getThreatPosition(
                  threat.angle,
                  actualMaxRadius - scaledImpactRadius
                );
                return (
                  <circle
                    key={`impact-${threat.id}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={scaledImpactRadius}
                    fill="#ef4444"
                    fillOpacity={0.15}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray="5,5"
                  />
                );
              })}

            {/* Connections */}
            {connections.map((connection) => {
              const fromElement = scaledElements.find(
                (el) => el.id === connection.from
              );
              const toElement = scaledElements.find(
                (el) => el.id === connection.to
              );
              if (!fromElement || !toElement) return null;

              return (
                <line
                  key={connection.id}
                  x1={fromElement.x}
                  y1={fromElement.y}
                  x2={toElement.x}
                  y2={toElement.y}
                  stroke="#6b7280"
                  strokeWidth={2}
                  className="cursor-pointer hover:opacity-50"
                  strokeDasharray={
                    connection.type === "backup" ? "5,5" : "none"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConnection(connection.id);
                  }}
                />
              );
            })}

            {/* Infrastructure elements */}
            {scaledElements.map((element) => {
              const isSelected = selectedElement === element.id;
              const isConnecting = connectingFrom === element.id;
              const originalElement = elements.find((e) => e.id === element.id);
              const elementWidth = originalElement?.width || 80;
              const elementHeight = originalElement?.height || 30;

              // Get wrapped text lines
              const textLines = wrapText(element.name, elementWidth - 8, 10);
              const lineHeight = 12;
              const totalTextHeight = textLines.length * lineHeight;
              const textStartY =
                element.y - totalTextHeight / 2 + lineHeight / 2;

              return (
                <g key={element.id}>
                  {/* Main element rectangle */}
                  <rect
                    x={element.x - elementWidth / 2}
                    y={element.y - elementHeight / 2}
                    width={elementWidth}
                    height={elementHeight}
                    rx={6}
                    fill="white"
                    stroke={
                      isSelected
                        ? "#ef4444"
                        : isConnecting
                        ? "#3b82f6"
                        : "#65a30d"
                    }
                    strokeWidth={isSelected || isConnecting ? 3 : 2}
                    className="cursor-move hover:stroke-blue-500"
                    filter="none"
                    onMouseDown={(e) => handleMouseDown(element.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleElementClick(element.id);
                    }}
                  />

                  {/* Wrapped text */}
                  <text
                    className="text-xs font-medium fill-gray-800 pointer-events-none select-none"
                    style={{ userSelect: "none" }}
                  >
                    {textLines.map((line, index) => (
                      <tspan
                        key={index}
                        x={element.x}
                        y={textStartY + index * lineHeight}
                        textAnchor="middle"
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>

                  {/* Resize handles - only show when selected */}
                  {isSelected && (
                    <>
                      {/* Southeast handle */}
                      <circle
                        cx={element.x + elementWidth / 2 - 3}
                        cy={element.y + elementHeight / 2 - 3}
                        r={4}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={1}
                        className="cursor-se-resize"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(element.id, "se", e)
                        }
                      />

                      {/* Southwest handle */}
                      <circle
                        cx={element.x - elementWidth / 2 + 3}
                        cy={element.y + elementHeight / 2 - 3}
                        r={4}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={1}
                        className="cursor-sw-resize"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(element.id, "sw", e)
                        }
                      />

                      {/* Northeast handle */}
                      <circle
                        cx={element.x + elementWidth / 2 - 3}
                        cy={element.y - elementHeight / 2 + 3}
                        r={4}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={1}
                        className="cursor-ne-resize"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(element.id, "ne", e)
                        }
                      />

                      {/* Northwest handle */}
                      <circle
                        cx={element.x - elementWidth / 2 + 3}
                        cy={element.y - elementHeight / 2 + 3}
                        r={4}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={1}
                        className="cursor-nw-resize"
                        onMouseDown={(e) =>
                          handleResizeMouseDown(element.id, "nw", e)
                        }
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <ControlPanel />
      </div>
    </div>
  );
}
