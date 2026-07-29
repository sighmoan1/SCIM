import { parseScimDsl } from "./parser";
import type { ScimDocument } from "./schema";

/**
 * Starter map for a typical household. This is what a fresh workspace opens
 * with: "You" in the centre, everyday protections for each of the six needs,
 * the systems those protections depend on, and one ready-made power-cut
 * scenario that shows how failure spreads and which backups survive.
 *
 * Synthetic example data only — see SECURITY.md.
 */
export const PERSONAL_STARTER_SOURCE = `model my-resilience "My resilience map" {
  perspective: individual
  focus: you
  description: "What protects one person from the six ways to die, and what those protections depend on."

  entity you "You" {
    kind: person
    layer: individual
  }

  entity tap-water "Tap water" {
    kind: water
    layer: household
    supports: [thirst]
  }

  entity stored-water "Stored drinking water" {
    kind: water
    layer: household
    supports: [thirst]
  }

  entity water-works "Water treatment works" {
    kind: water
    layer: region
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
    failure-modes: [time-and-wear, violence-or-disaster]
  }

  entity food-shops "Local food shops" {
    kind: food
    layer: municipality
    supports: [hunger]
  }

  entity home-food "Home food stores" {
    kind: food
    layer: household
    supports: [hunger]
  }

  entity cooling "Shade and ventilation" {
    kind: shelter
    layer: household
    supports: [too-hot]
  }

  entity heating "Home heating" {
    kind: shelter
    layer: household
    supports: [too-cold]
  }

  entity gas "Gas supply" {
    kind: fuel
    layer: region
  }

  entity hospital "Hospital A&E" {
    kind: healthcare
    layer: municipality
    supports: [injury]
  }

  entity first-aid "First aid kit" {
    kind: healthcare
    layer: household
    supports: [injury]
  }

  entity gp "GP surgery" {
    kind: healthcare
    layer: municipality
    supports: [illness]
  }

  entity pharmacy "Pharmacy" {
    kind: healthcare
    layer: municipality
    supports: [illness]
  }

  tap-water -> you {
    id: tap-water-you
    kind: protects
    critical: true
  }

  stored-water -> you {
    id: stored-water-you
    kind: backup-for
    critical: true
  }

  water-works -> tap-water {
    id: water-works-tap-water
    kind: supplies
    mode: grid
    critical: true
  }

  grid -> water-works {
    id: grid-water-works
    kind: supplies
    mode: grid
    critical: true
  }

  food-shops -> you {
    id: food-shops-you
    kind: protects
    critical: true
  }

  home-food -> you {
    id: home-food-you
    kind: backup-for
    critical: true
  }

  cooling -> you {
    id: cooling-you
    kind: protects
    critical: true
  }

  heating -> you {
    id: heating-you
    kind: protects
    critical: true
  }

  gas -> heating {
    id: gas-heating
    kind: supplies
    mode: grid
    critical: true
  }

  hospital -> you {
    id: hospital-you
    kind: protects
    critical: true
  }

  first-aid -> you {
    id: first-aid-you
    kind: backup-for
    critical: true
  }

  gp -> you {
    id: gp-you
    kind: protects
    critical: true
  }

  pharmacy -> you {
    id: pharmacy-you
    kind: protects
    critical: true
  }

  grid -> hospital {
    id: grid-hospital
    kind: supplies
    mode: grid
    critical: true
  }

  grid -> gp {
    id: grid-gp
    kind: supplies
    mode: grid
    critical: true
  }

  scenario power-cut "Power cut" {
    description: "The regional electricity grid goes down. Water treatment, the hospital and the GP lose power; stored water, food stores and first aid still work."
    set grid status failed
  }

  view main radial "My resilience radial SCIM" {
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

    place you at 500 500 size 100 36
    place tap-water at 600 500 size 110 40
    place stored-water at 594 552 size 120 40
    place water-works at 780 500 size 130 40
    place grid at 572 230 size 120 40
    place food-shops at 610 690 size 120 40
    place home-food at 550 586 size 120 40
    place cooling at 450 586 size 130 40
    place heating at 400 500 size 110 40
    place gas at 220 500 size 100 40
    place hospital at 390 310 size 110 40
    place first-aid at 450 413 size 100 40
    place gp at 610 310 size 100 40
    place pharmacy at 656 344 size 100 40
  }
}`;

export function createPersonalStarterDocument(): ScimDocument {
  return parseScimDsl(PERSONAL_STARTER_SOURCE);
}
