// Simple JSON Schema validation utilities
// For production, consider using libraries like Ajv

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateInfrastructureMap(data: any): ValidationResult {
    const errors: string[] = [];

    // Basic structure validation
    if (!data.version) errors.push("Missing version field");
    if (!data.coordinateSystem) errors.push("Missing coordinateSystem field");
    if (!data.layers) errors.push("Missing layers field");
    if (!data.elements) errors.push("Missing elements field");
    if (!data.threats) errors.push("Missing threats field");
    if (!data.connections) errors.push("Missing connections field");
    if (!data.metadata) errors.push("Missing metadata field");

    // Version format validation
    if (data.version && !/^\d{4}-\d{2}-\d{2}$/.test(data.version)) {
        errors.push("Version must be in YYYY-MM-DD format");
    }

    // Coordinate system validation
    if (data.coordinateSystem) {
        const cs = data.coordinateSystem;
        if (!cs.type || cs.type !== "cartesian") {
            errors.push("coordinateSystem.type must be 'cartesian'");
        }
        if (typeof cs.centerX !== "number" || typeof cs.centerY !== "number") {
            errors.push("coordinateSystem must have numeric centerX and centerY");
        }
    }

    // Elements validation
    if (Array.isArray(data.elements)) {
        data.elements.forEach((element: any, index: number) => {
            if (!element.id) errors.push(`Element ${index}: missing id`);
            if (!element.name) errors.push(`Element ${index}: missing name`);
            if (typeof element.x !== "number") errors.push(`Element ${index}: x must be a number`);
            if (typeof element.y !== "number") errors.push(`Element ${index}: y must be a number`);
            if (typeof element.layer !== "number") errors.push(`Element ${index}: layer must be a number`);
        });
    }

    // Threats validation
    if (Array.isArray(data.threats)) {
        data.threats.forEach((threat: any, index: number) => {
            if (!threat.id) errors.push(`Threat ${index}: missing id`);
            if (!threat.name) errors.push(`Threat ${index}: missing name`);
            if (typeof threat.angle !== "number" || threat.angle < 0 || threat.angle >= 360) {
                errors.push(`Threat ${index}: angle must be between 0 and 360`);
            }
            if (typeof threat.impactRadius !== "number" || threat.impactRadius < 0) {
                errors.push(`Threat ${index}: impactRadius must be a non-negative number`);
            }
        });
    }

    // Layers validation
    if (data.layers && typeof data.layers === "object") {
        Object.entries(data.layers).forEach(([key, layer]: [string, any]) => {
            if (!layer.id) errors.push(`Layer ${key}: missing id`);
            if (!layer.name) errors.push(`Layer ${key}: missing name`);
            if (typeof layer.radius !== "number" || layer.radius < 0) {
                errors.push(`Layer ${key}: radius must be a non-negative number`);
            }
            if (typeof layer.opacity !== "number" || layer.opacity < 0 || layer.opacity > 1) {
                errors.push(`Layer ${key}: opacity must be between 0 and 1`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateExportBeforeDownload(data: any): boolean {
    const result = validateInfrastructureMap(data);
    if (!result.valid) {
        console.error("Export validation failed:", result.errors);
        alert(`Export validation failed:\n${result.errors.slice(0, 5).join('\n')}`);
        return false;
    }
    return true;
} 