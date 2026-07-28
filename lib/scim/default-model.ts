import { parseScimDsl } from "./parser";
import type { ScimDocument } from "./schema";

export const DEFAULT_SCIM_SOURCE = `model hospital-resilience "Hospital resilience" {
  perspective: individual
  focus: patient
  description: "How a patient remains protected during a regional electricity failure."

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity hospital "District hospital" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
    failure-modes: [operators, system-externalities]
  }

  entity grid "Regional electricity grid" {
    kind: power
    layer: region
    failure-modes: [time-and-wear, system-externalities, violence-or-disaster]
  }

  entity generator "Hospital backup generator" {
    kind: power
    layer: municipality
    failure-modes: [neglect, operators]
    fuel-hours: 36
  }

  entity fuel-depot "Fuel depot" {
    kind: fuel
    layer: region
    failure-modes: [system-externalities, economics]
  }

  grid -> hospital {
    id: grid-hospital
    kind: supplies
    mode: grid
    critical: true
    service-effects: [provision, quality]
    requirement-group: hospital-power
    requirement-service: electricity
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  generator -> hospital {
    id: generator-hospital
    kind: backup-for
    mode: on-site
    critical: true
    service-effects: [provision]
    requirement-group: hospital-power
    requirement-service: electricity
    requirement-policy: any
    minimum-available: 1
    when-unsatisfied: failed
  }

  fuel-depot -> generator {
    id: fuel-generator
    kind: supplies
    mode: delivery
    critical: true
    service-effects: [provision, cost]
  }

  hospital -> patient {
    id: hospital-patient
    kind: protects
    critical: true
    service-effects: [provision, quality]
  }

  scenario total-power-loss "Grid and generator unavailable" {
    description: "Tests the explicit hospital-power requirement when neither provider is available."
    set grid status failed
    set generator status failed
    set relationship grid-hospital status failed
    set relationship generator-hospital status failed
  }

  view main radial "Hospital resilience radial SCIM" {
    renderer: scim-radial-1
    layout: frozen
    canvas: 1000 1000
    centre: 500 500
    segments: true

    ring individual radius 70
    ring household radius 130
    ring neighbourhood radius 190
    ring municipality radius 250
    ring region radius 310
    ring country radius 370
    ring world radius 430

    sector injury angle 210
    sector illness angle 270
    sector thirst angle 330
    sector hunger angle 30
    sector too-hot angle 90
    sector too-cold angle 150

    place patient at 500 500 size 100 36
    place hospital at 370 420 size 130 42
    place generator at 615 430 size 140 42
    place grid at 720 290 size 140 42
    place fuel-depot at 780 520 size 110 42

    route grid-hospital via 720 290, 560 340, 370 420
    route generator-hospital via 615 430, 500 425, 370 420
    route fuel-generator via 780 520, 700 475, 615 430
    route hospital-patient via 370 420, 440 460, 500 500
  }
}`;

export function createDefaultScimDocument(): ScimDocument {
  return parseScimDsl(DEFAULT_SCIM_SOURCE);
}
