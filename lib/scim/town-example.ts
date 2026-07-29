import { parseScimDsl } from "./parser";
import type { ScimDocument } from "./schema";

/**
 * A worked multi-tier example, faithful to Dealing in Security: one map that
 * spans all four tiers of cooperation — individual, group, organisation and
 * nation-state — so the needs matrix (INAM) is populated across every tier and
 * several layers of provision. Synthetic data only (see SECURITY.md).
 *
 * The radial view places the individual tier (the classic person-centred SCIM
 * picture); the higher tiers appear in the matrix, which reads each need across
 * the layers of provision.
 */
export const TOWN_EXAMPLE_SOURCE = `model town-resilience "Town resilience" {
  perspective: integrated
  focus: resident
  description: "How a town keeps its people alive across all four tiers of cooperation."

  entity resident "A resident" {
    kind: person
    layer: individual
  }

  entity heating "Home heating" {
    kind: shelter
    layer: household
    supports: [too-cold]
  }

  entity cooling "Shade and cooling" {
    kind: shelter
    layer: household
    supports: [too-hot]
  }

  entity tap-water "Tap water" {
    kind: water
    layer: household
    supports: [thirst]
  }

  entity food-shops "Local food shops" {
    kind: food
    layer: municipality
    supports: [hunger]
  }

  entity gp "GP surgery" {
    kind: healthcare
    layer: municipality
    supports: [illness]
  }

  entity hospital "District hospital" {
    kind: healthcare
    layer: region
    supports: [injury]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
  }

  entity phones "Phone and internet" {
    kind: communications
    layer: municipality
    supports: [communications]
  }

  entity buses "Local buses" {
    kind: transport
    layer: municipality
    supports: [transport]
  }

  entity hall "Community hall" {
    kind: service
    layer: neighbourhood
    supports: [space]
  }

  entity mutual-aid "Mutual-aid rota" {
    kind: service
    layer: neighbourhood
    supports: [resource-control]
  }

  entity eoc "Emergency operations centre" {
    kind: service
    layer: municipality
    supports: [shared-map, shared-plan]
  }

  entity deputy-plan "Deputy and succession plan" {
    kind: service
    layer: municipality
    supports: [shared-succession]
  }

  entity courts "Courts and law" {
    kind: security
    layer: country
    supports: [jurisdiction]
  }

  entity registry "Population registry" {
    kind: service
    layer: country
    supports: [citizens]
  }

  entity land-registry "Land registry" {
    kind: service
    layer: country
    supports: [territory]
  }

  entity police "Police and civil protection" {
    kind: security
    layer: region
    supports: [effective-organisations]
  }

  entity foreign-office "Foreign office" {
    kind: service
    layer: country
    supports: [international-recognition]
  }

  grid -> heating {
    id: grid-heating
    kind: supplies
    mode: grid
    critical: true
  }

  grid -> tap-water {
    id: grid-tap-water
    kind: supplies
    mode: grid
    critical: true
  }

  grid -> hospital {
    id: grid-hospital
    kind: supplies
    mode: grid
    critical: true
  }

  grid -> phones {
    id: grid-phones
    kind: supplies
    mode: grid
    critical: true
  }

  heating -> resident {
    id: heating-resident
    kind: protects
    critical: true
  }

  cooling -> resident {
    id: cooling-resident
    kind: protects
    critical: true
  }

  tap-water -> resident {
    id: tap-water-resident
    kind: protects
    mode: grid
    critical: true
  }

  food-shops -> resident {
    id: food-shops-resident
    kind: protects
    mode: fetch
    critical: true
  }

  gp -> resident {
    id: gp-resident
    kind: protects
    critical: true
  }

  hospital -> resident {
    id: hospital-resident
    kind: protects
    critical: true
  }

  scenario power-cut "Regional power cut" {
    description: "The electricity grid fails: heating, tap water, the hospital and phones lose power."
    set grid status failed
  }

  view main radial "Town resilience radial SCIM" {
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

    place resident at 500 500 size 100 36
    place heating at 400 500 size 110 40
    place cooling at 470 590 size 120 40
    place tap-water at 600 470 size 110 40
    place food-shops at 560 700 size 120 40
    place gp at 640 340 size 100 40
    place hospital at 380 300 size 120 40
    place grid at 610 250 size 110 40
  }
}`;

export function createTownExampleDocument(): ScimDocument {
  return parseScimDsl(TOWN_EXAMPLE_SOURCE);
}
