# SCIM Infrastructure Map Export Format

## Overview

This document describes the enhanced JSON export format for the SCIM (Supply Chain Infrastructure Mapping) application. The format has been designed to be LLM-friendly and includes comprehensive metadata for better analysis and visualization.

## Key Features

### 1. ✅ Human-Oriented Descriptions

Each entity includes a `description` field providing context for LLMs:

```json
{
  "name": "hospital",
  "description": "Emergency and healthcare services",
  "type": "service/health"
}
```

### 2. ✅ Explicit Coordinate System

Clear specification of coordinate system and origin:

```json
{
  "coordinateSystem": {
    "type": "cartesian",
    "origin": "center",
    "units": "pixels",
    "centerX": 450,
    "centerY": 400
  }
}
```

### 3. ✅ Dual Coordinates

Both cartesian and polar coordinates for easy analysis:

```json
{
  "x": 600,
  "y": 400,
  "polar": {
    "r": 150.83,
    "theta": 343.43
  }
}
```

### 4. ✅ Normalized Layer IDs

Layers indexed by semantic names rather than numeric indices:

```json
{
  "layers": {
    "person": { "id": "1", "name": "person", "radius": 60 },
    "home": { "id": "2", "name": "home", "radius": 100 }
  }
}
```

### 5. ✅ Semantic Type Fields

Structured type classification for automatic styling:

```json
{
  "type": "utility/power" // utility/water, service/health, etc.
}
```

### 6. ✅ Style Hints

Automated styling suggestions based on semantic types:

```json
{
  "styleHints": {
    "utility/power": { "icon": "⚡", "fill": "#facc15", "stroke": "#eab308" },
    "service/health": { "icon": "🏥", "fill": "#ef4444", "stroke": "#dc2626" }
  }
}
```

### 7. ✅ Embedded Dependencies

Dependencies included directly in elements:

```json
{
  "id": "home",
  "dependsOn": ["power_station", "water_plant"]
}
```

### 8. ✅ JSON Schema Definition

Complete schema validation at `lib/infrastructure-map-schema.json`

### 9. ✅ Version & Units Metadata

Backward compatibility and unit specification:

```json
{
  "version": "2025-01-01",
  "defaults": {
    "distanceUnits": "px",
    "angleUnits": "deg"
  }
}
```

### 10. ✅ Pre-computed Z-Index

Drawing order specification for overlapping elements:

```json
{
  "zIndex": 10 // Higher values draw on top
}
```

## Example Export Structure

```json
{
  "version": "2025-01-01",
  "coordinateSystem": {
    "type": "cartesian",
    "origin": "center",
    "units": "pixels",
    "centerX": 450,
    "centerY": 400
  },
  "defaults": {
    "distanceUnits": "px",
    "angleUnits": "deg"
  },
  "styleHints": {
    "utility/power": { "icon": "⚡", "fill": "#facc15" },
    "service/health": { "icon": "🏥", "fill": "#ef4444" }
  },
  "layers": {
    "person": {
      "id": "1",
      "name": "person",
      "description": "Individual person level",
      "radius": 60,
      "color": "#dcfce7",
      "opacity": 0.4
    }
  },
  "elements": [
    {
      "id": "power_station",
      "name": "power station",
      "description": "Electrical generation facility",
      "type": "utility/power",
      "x": 600,
      "y": 400,
      "polar": { "r": 150.83, "theta": 343.43 },
      "layer": 3,
      "zIndex": 3,
      "dependsOn": []
    }
  ],
  "threats": [
    {
      "id": "1",
      "name": "injury",
      "description": "Physical harm and accidents",
      "angle": 0,
      "impactRadius": 50
    }
  ],
  "connections": [],
  "impactZones": [],
  "metadata": {
    "exportedAt": "2025-01-01T12:00:00Z",
    "exportedBy": "SCIM Infrastructure Mapper"
  }
}
```

## Benefits for LLMs

1. **Rich Context**: Description fields provide semantic understanding
2. **No Ambiguity**: Explicit coordinate systems eliminate guesswork
3. **Easy Queries**: "What's in the outer ring?" answered via polar coordinates
4. **Smart Styling**: Automatic icon/color selection based on semantic types
5. **Dependency Walking**: Direct traversal without cross-referencing
6. **Validation**: Schema ensures data integrity
7. **Future-Proof**: Version metadata enables backward compatibility

## Usage

The enhanced export format is automatically generated when using the Export button in the application. The format includes built-in validation to ensure data integrity before download.

## Schema Validation

Use the JSON Schema at `lib/infrastructure-map-schema.json` to validate exported files:

```javascript
import { validateInfrastructureMap } from "./lib/validation";

const result = validateInfrastructureMap(exportedData);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```
