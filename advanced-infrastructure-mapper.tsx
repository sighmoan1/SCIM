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
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
} from "lucide-react";
import { validateExportBeforeDownload } from "@/lib/validation";

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

interface ImpactZone {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  threatId?: string;
  zIndex?: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type?: string;
  strength?: number;
  description?: string;
}

interface Layer {
  id: string;
  name: string;
  radius: number;
  color: string;
  opacity: number;
}

// Export format interface
interface InfrastructureMapExport {
  version: string;
  coordinateSystem: {
    type: "cartesian";
    origin: "center";
    units: "pixels";
    centerX: number;
    centerY: number;
  };
  defaults: {
    distanceUnits: "px";
    angleUnits: "deg";
  };
  layers: Record<string, Layer>;
  threats: Threat[];
  elements: InfrastructureElement[];
  connections: Connection[];
  impactZones: ImpactZone[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
  };
}

const defaultLayers: Layer[] = [
  {
    id: "1",
    name: "person",
    radius: 60,
    color: "#dcfce7",
    opacity: 0.4,
  },
  {
    id: "2",
    name: "home",
    radius: 100,
    color: "#bbf7d0",
    opacity: 0.4,
  },
  {
    id: "3",
    name: "village",
    radius: 140,
    color: "#86efac",
    opacity: 0.4,
  },
  {
    id: "4",
    name: "town",
    radius: 180,
    color: "#4ade80",
    opacity: 0.4,
  },
  {
    id: "5",
    name: "region",
    radius: 220,
    color: "#22c55e",
    opacity: 0.4,
  },
  {
    id: "6",
    name: "country",
    radius: 260,
    color: "#16a34a",
    opacity: 0.4,
  },
  {
    id: "7",
    name: "world",
    radius: 300,
    color: "#15803d",
    opacity: 0.4,
  },
];

const defaultThreats: Threat[] = [
  {
    id: "1",
    name: "injury",
    angle: 0,
    impactRadius: 50,
  },
  {
    id: "2",
    name: "too hot",
    angle: 60,
    impactRadius: 40,
  },
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
  {
    id: "6",
    name: "illness",
    angle: 300,
    impactRadius: 50,
  },
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

const LICENSE_TEXT = `This work is licensed under the Creative Commons Attribution-Noncommercial-Share Alike 2.0 UK: England & Wales License.\nTo view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/2.0/uk/ or send a letter to Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.\n\nAuthors:\nMike Bennett: As founder managing director of Plain Software, Mike played a vital role in the development of NHS Direct. He is now a strategic consultant on social, business and government resilience.\nVinay Gupta: Co-editor of Small is Profitable (The Economist's book of the year 2003) and Winning the Oil Endgame, Vinay focusses on whole systems response to crisis and change mitigation.\nSTAR-TIDES: SCIM is the underlying model for the US Department of Defense STAR-TIDES project on crisis response and humanitarian relief. (see Defense Horizons #70)`;

export default function AdvancedInfrastructureMapper() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [threats, setThreats] = useState<Threat[]>(defaultThreats);
  const [elements, setElements] =
    useState<InfrastructureElement[]>(defaultElements);
  const [connections, setConnections] =
    useState<Connection[]>(defaultConnections);
  const [impactZones, setImpactZones] = useState<ImpactZone[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedImpactZone, setSelectedImpactZone] = useState<string | null>(
    null
  );
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [draggedImpactZone, setDraggedImpactZone] = useState<string | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showSegments, setShowSegments] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("elements");
  const [svgDimensions, setSvgDimensions] = useState({
    width: 900,
    height: 800,
  });
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [resizingImpactZone, setResizingImpactZone] = useState<string | null>(
    null
  );
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Form states
  const [newElementName, setNewElementName] = useState("");
  const [newThreatName, setNewThreatName] = useState("");
  const [newLayerName, setNewLayerName] = useState("");
  const [newImpactZoneName, setNewImpactZoneName] = useState("");
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState("");
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementName, setEditingElementName] = useState("");
  const [editingImpactZoneId, setEditingImpactZoneId] = useState<string | null>(
    null
  );
  const [editingImpactZoneName, setEditingImpactZoneName] = useState("");
  const [draggedSegment, setDraggedSegment] = useState<string | null>(null);

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

  const handleImpactZoneResize = useCallback(
    (e: React.MouseEvent) => {
      if (resizingImpactZone && resizeHandle && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX =
          (e.clientX - rect.left) * (svgDimensions.width / rect.width);
        const mouseY =
          (e.clientY - rect.top) * (svgDimensions.height / rect.height);

        setImpactZones((prev) =>
          prev.map((zone) => {
            if (zone.id === resizingImpactZone) {
              // Calculate distance from center to mouse position
              const dx = mouseX - zone.x;
              const dy = mouseY - zone.y;
              const newRadius = Math.max(20, Math.sqrt(dx * dx + dy * dy));

              return { ...zone, radius: newRadius };
            }
            return zone;
          })
        );
      }
    },
    [resizingImpactZone, resizeHandle, svgDimensions]
  );

  const handleSegmentMouseDown = (threatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedSegment(threatId);
  };

  const handleSegmentDrag = useCallback(
    (e: React.MouseEvent) => {
      if (draggedSegment && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX =
          (e.clientX - rect.left) * (svgDimensions.width / rect.width);
        const mouseY =
          (e.clientY - rect.top) * (svgDimensions.height / rect.height);

        // Calculate angle from center to mouse position
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Normalize angle to 0-360 range
        if (angle < 0) angle += 360;

        // Update the threat's angle
        setThreats((prev) =>
          prev.map((threat) =>
            threat.id === draggedSegment ? { ...threat, angle } : threat
          )
        );
      }
    },
    [draggedSegment, svgDimensions, centerX, centerY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (resizingElement) {
        handleResize(e);
      } else if (resizingImpactZone) {
        handleImpactZoneResize(e);
      } else if (draggedSegment) {
        handleSegmentDrag(e);
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
      } else if (draggedImpactZone && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();

        // Get mouse position in SVG coordinate system (accounting for viewBox)
        const mouseX =
          (e.clientX - rect.left) * (svgDimensions.width / rect.width);
        const mouseY =
          (e.clientY - rect.top) * (svgDimensions.height / rect.height);

        // Apply the offset to maintain the impact zone's position relative to where the user clicked
        const x = mouseX - dragOffset.x;
        const y = mouseY - dragOffset.y;

        setImpactZones((prev) =>
          prev.map((zone) =>
            zone.id === draggedImpactZone
              ? {
                  ...zone,
                  x,
                  y,
                }
              : zone
          )
        );
      }
    },
    [
      draggedElement,
      draggedImpactZone,
      draggedSegment,
      resizingElement,
      resizingImpactZone,
      svgDimensions,
      dragOffset,
      centerX,
      centerY,
      scaledElements,
      handleResize,
      handleSegmentDrag,
    ]
  );

  const handleMouseUp = () => {
    setDraggedElement(null);
    setDraggedImpactZone(null);
    setResizingElement(null);
    setResizingImpactZone(null);
    setResizeHandle(null);
    setDraggedSegment(null);
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

  // Recalculate all layer radii to eliminate gaps
  const recalculateLayerRadii = (layerList: Layer[]) => {
    const baseRadius = 60;
    const radiusIncrement = 40;

    return layerList.map((layer, index) => ({
      ...layer,
      radius: baseRadius + index * radiusIncrement,
    }));
  };

  const addLayer = () => {
    if (!newLayerName.trim()) return;

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: newLayerName,
      radius: 0, // Will be recalculated
      color: `hsl(${Math.random() * 360}, 50%, 70%)`,
      opacity: 0.4,
    };

    const updatedLayers = [...layers, newLayer];
    const recalculatedLayers = recalculateLayerRadii(updatedLayers);
    setLayers(recalculatedLayers);
    setNewLayerName("");
  };

  const moveLayer = (layerId: string, direction: "up" | "down") => {
    const currentIndex = layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    [newLayers[currentIndex], newLayers[newIndex]] = [
      newLayers[newIndex],
      newLayers[currentIndex],
    ];

    const recalculatedLayers = recalculateLayerRadii(newLayers);
    setLayers(recalculatedLayers);
  };

  const updateLayerName = (layerId: string, newName: string) => {
    if (!newName.trim()) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, name: newName.trim() } : layer
      )
    );
  };

  const startEditingLayer = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingLayerName(currentName);
  };

  const cancelEditingLayer = () => {
    setEditingLayerId(null);
    setEditingLayerName("");
  };

  const saveEditingLayer = () => {
    if (!editingLayerId || !editingLayerName.trim()) return;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === editingLayerId
          ? { ...layer, name: editingLayerName.trim() }
          : layer
      )
    );

    setEditingLayerId(null);
    setEditingLayerName("");
  };

  const startEditingElement = (elementId: string, currentName: string) => {
    setEditingElementId(elementId);
    setEditingElementName(currentName);
  };

  const cancelEditingElement = () => {
    setEditingElementId(null);
    setEditingElementName("");
  };

  const saveEditingElement = () => {
    if (editingElementId && editingElementName.trim()) {
      updateElementName(editingElementId, editingElementName);
    }
    cancelEditingElement();
  };

  const startEditingImpactZone = (zoneId: string, currentName: string) => {
    setEditingImpactZoneId(zoneId);
    setEditingImpactZoneName(currentName);
  };

  const cancelEditingImpactZone = () => {
    setEditingImpactZoneId(null);
    setEditingImpactZoneName("");
  };

  const saveEditingImpactZone = () => {
    if (editingImpactZoneId && editingImpactZoneName.trim()) {
      updateImpactZoneName(editingImpactZoneId, editingImpactZoneName);
    }
    cancelEditingImpactZone();
  };

  const updateElementName = (elementId: string, newName: string) => {
    if (!newName.trim()) return;

    setElements((prev) =>
      prev.map((element) =>
        element.id === elementId
          ? { ...element, name: newName.trim() }
          : element
      )
    );
  };

  const updateImpactZoneName = (zoneId: string, newName: string) => {
    if (!newName.trim()) return;

    setImpactZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, name: newName.trim() } : zone
      )
    );
  };

  const addImpactZone = () => {
    if (!newImpactZoneName.trim()) return;

    const newImpactZone: ImpactZone = {
      id: Date.now().toString(),
      name: newImpactZoneName,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200,
      radius: 60,
    };

    setImpactZones((prev) => [...prev, newImpactZone]);
    setNewImpactZoneName("");
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
    const updatedLayers = layers.filter((layer) => layer.id !== layerId);
    const recalculatedLayers = recalculateLayerRadii(updatedLayers);
    setLayers(recalculatedLayers);
  };

  const deleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
  };

  const deleteImpactZone = (zoneId: string) => {
    setImpactZones((prev) => prev.filter((zone) => zone.id !== zoneId));
  };

  const handleImpactZoneMouseDown = (zoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();

      // Get mouse position in SVG coordinate system (accounting for viewBox)
      const mouseX =
        (e.clientX - rect.left) * (svgDimensions.width / rect.width);
      const mouseY =
        (e.clientY - rect.top) * (svgDimensions.height / rect.height);

      // Find the impact zone
      const zone = impactZones.find((z) => z.id === zoneId);

      if (zone) {
        // Calculate the offset between mouse position and zone center
        const offsetX = mouseX - zone.x;
        const offsetY = mouseY - zone.y;
        setDragOffset({ x: offsetX, y: offsetY });
      }
    }

    setDraggedImpactZone(zoneId);
    setSelectedImpactZone(zoneId);
  };

  const handleImpactZoneResizeMouseDown = (
    zoneId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setResizingImpactZone(zoneId);
    setResizeHandle("resize");
  };

  // Helper function to calculate polar coordinates
  const calculatePolar = (
    x: number,
    y: number,
    centerX: number,
    centerY: number
  ) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const theta = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    return { r, theta };
  };

  const exportData = () => {
    // Convert elements to include polar coordinates
    const enhancedElements = elements.map((element) => ({
      ...element,
      polar: calculatePolar(element.x, element.y, centerX, centerY),
    }));

    // Convert impact zones to include polar coordinates
    const enhancedImpactZones = impactZones.map((zone) => ({
      ...zone,
      polar: calculatePolar(zone.x, zone.y, centerX, centerY),
    }));

    // Convert layers to normalized format
    const layersMap = layers.reduce((acc, layer) => {
      acc[layer.name] = layer;
      return acc;
    }, {} as Record<string, Layer>);

    const exportData: InfrastructureMapExport = {
      version: "2025-01-01",
      coordinateSystem: {
        type: "cartesian",
        origin: "center",
        units: "pixels",
        centerX,
        centerY,
      },
      defaults: {
        distanceUnits: "px",
        angleUnits: "deg",
      },
      layers: layersMap,
      threats,
      elements: enhancedElements,
      connections,
      impactZones: enhancedImpactZones,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: "SCIM Infrastructure Mapper",
      },
    };

    // Validate export data before downloading
    if (!validateExportBeforeDownload(exportData)) {
      return; // Validation failed, don't proceed with download
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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

        // Handle both old format (array) and new format (object) for layers
        if (data.layers) {
          if (Array.isArray(data.layers)) {
            // Old format - layers is already an array
            setLayers(data.layers);
          } else {
            // New format - layers is an object, convert to array
            const layersArray = Object.values(data.layers) as Layer[];
            setLayers(layersArray);
          }
        }

        if (data.threats) setThreats(data.threats);
        if (data.elements) setElements(data.elements);
        if (data.connections) setConnections(data.connections);
        if (data.impactZones) setImpactZones(data.impactZones);

        // Show success message
        alert("Data imported successfully!");
      } catch (error) {
        console.error("Failed to import data:", error);
        alert("Failed to import data. Please check the file format.");
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
  const ControlPanel = useCallback(
    () => (
      <div className="h-full flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-5 mx-2 mt-2">
            <TabsTrigger value="elements" className="text-xs">
              Elements
            </TabsTrigger>
            <TabsTrigger value="threats" className="text-xs">
              Threats
            </TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">
              Layers
            </TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">
              Impact
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
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {scaledElements.map((element) => (
                    <div
                      key={element.id}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        selectedElement === element.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Element content */}
                      <div className="flex-1 min-w-0">
                        {editingElementId === element.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingElementName}
                              onChange={(e) =>
                                setEditingElementName(e.target.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  saveEditingElement();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  cancelEditingElement();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="text-sm h-6"
                              autoFocus
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                saveEditingElement();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                cancelEditingElement();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer group"
                            onClick={() =>
                              startEditingElement(element.id, element.name)
                            }
                          >
                            <div className="text-sm font-medium flex items-center gap-2">
                              {element.name}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-gray-500">
                              Layer: {element.layer} • Position: (
                              {Math.round(element.x)}, {Math.round(element.y)})
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteElement(element.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
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
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {threats.map((threat) => (
                    <div
                      key={threat.id}
                      className="flex items-center justify-between p-2 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{threat.name}</div>
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
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {scaledLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-2 p-2 rounded border border-gray-200"
                    >
                      {/* Layer ordering controls */}
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            moveLayer(layer.id, "up");
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            moveLayer(layer.id, "down");
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          disabled={index === scaledLayers.length - 1}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Layer content */}
                      <div className="flex-1 min-w-0">
                        {editingLayerId === layer.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingLayerName}
                              onChange={(e) =>
                                setEditingLayerName(e.target.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  saveEditingLayer();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  cancelEditingLayer();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="text-sm h-6"
                              autoFocus
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                saveEditingLayer();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                cancelEditingLayer();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer group"
                            onClick={() =>
                              startEditingLayer(layer.id, layer.name)
                            }
                          >
                            <div className="text-sm font-medium flex items-center gap-2">
                              {layer.name}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-gray-500">
                              Radius: {Math.round(layer.radius)}px • Index:{" "}
                              {index + 1}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteLayer(layer.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Add Impact Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Impact zone name"
                      value={newImpactZoneName}
                      onChange={(e) => setNewImpactZoneName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          addImpactZone();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                  </div>
                  <Button onClick={addImpactZone} size="sm" className="w-full">
                    Add Impact Zone
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Impact Zones</Label>
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {impactZones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        selectedImpactZone === zone.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Impact zone content */}
                      <div className="flex-1 min-w-0">
                        {editingImpactZoneId === zone.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingImpactZoneName}
                              onChange={(e) =>
                                setEditingImpactZoneName(e.target.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  saveEditingImpactZone();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  cancelEditingImpactZone();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="text-sm h-6"
                              autoFocus
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                saveEditingImpactZone();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                cancelEditingImpactZone();
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer group"
                            onClick={() =>
                              startEditingImpactZone(zone.id, zone.name)
                            }
                          >
                            <div className="text-sm font-medium flex items-center gap-2">
                              {zone.name}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-gray-500">
                              Radius: {Math.round(zone.radius)}px • Position: (
                              {Math.round(zone.x)}, {Math.round(zone.y)})
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteImpactZone(zone.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
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
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
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
                                    connectionColors[
                                      (connection.type ||
                                        "dependency") as keyof typeof connectionColors
                                    ],
                                }}
                                className="text-xs text-white"
                              >
                                {connection.type || "dependency"}
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
          <div className="p-4 border-t bg-gray-50"></div>
        </Tabs>
      </div>
    ),
    [
      activeTab,
      newElementName,
      newThreatName,
      newLayerName,
      newImpactZoneName,
      scaledElements,
      selectedElement,
      connectingFrom,
      threats,
      layers,
      impactZones,
      selectedImpactZone,
      connections,
      editingLayerId,
      editingLayerName,
      addElement,
      addThreat,
      addLayer,
      addImpactZone,
      deleteElement,
      deleteThreat,
      deleteLayer,
      deleteImpactZone,
      deleteConnection,
      startEditingLayer,
      saveEditingLayer,
      cancelEditingLayer,
    ]
  );

  const [showLicense, setShowLicense] = useState(false);

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
                {ControlPanel()}
              </SheetContent>
            </Sheet>
            <h1 className="text-lg sm:text-xl font-bold">
              Critical Infrastructure Mapper
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLicense(true)}
            >
              View License
            </Button>
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
              setSelectedImpactZone(null);
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
                    {/* Draggable handle at the end of the radial line */}
                    <circle
                      cx={
                        centerX +
                        Math.cos((segment.startAngle * Math.PI) / 180) *
                          actualMaxRadius
                      }
                      cy={
                        centerY +
                        Math.sin((segment.startAngle * Math.PI) / 180) *
                          actualMaxRadius
                      }
                      r={8}
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-pointer hover:fill-red-600"
                      onMouseDown={(e) =>
                        handleSegmentMouseDown(segment.threat.id, e)
                      }
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

            {/* Custom Impact Zones */}
            {impactZones.map((zone) => {
              const isSelected = selectedImpactZone === zone.id;

              return (
                <g key={`custom-impact-${zone.id}`}>
                  {/* Main impact zone circle */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={zone.radius}
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    stroke={isSelected ? "#3b82f6" : "#3b82f6"}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeOpacity={0.7}
                    strokeDasharray="5,5"
                    className="cursor-move hover:stroke-blue-600"
                    onMouseDown={(e) => handleImpactZoneMouseDown(zone.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImpactZone(zone.id);
                    }}
                  />

                  {/* Impact zone label */}
                  <text
                    x={zone.x}
                    y={zone.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-medium fill-blue-700 pointer-events-none select-none"
                    style={{ userSelect: "none" }}
                  >
                    {zone.name}
                  </text>

                  {/* Resize handle - only show when selected */}
                  {isSelected && (
                    <circle
                      cx={zone.x + zone.radius - 10}
                      cy={zone.y}
                      r={6}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-pointer hover:fill-blue-700"
                      onMouseDown={(e) =>
                        handleImpactZoneResizeMouseDown(zone.id, e)
                      }
                    />
                  )}
                </g>
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
                    (connection.type || "dependency") === "backup"
                      ? "5,5"
                      : "none"
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
        {ControlPanel()}
      </div>

      {/* License Modal/Sheet */}
      {showLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowLicense(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-2">License & Authors</h2>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 mb-2">
              {LICENSE_TEXT}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
