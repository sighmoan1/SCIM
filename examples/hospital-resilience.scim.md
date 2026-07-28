# Hospital resilience

A portable example showing SCIM narrative context, explicit dependency logic, scenarios and a frozen radial layout that can be rendered identically by the application or passed to an AI conversation.

```scim
model hospital-resilience "Hospital resilience" {
  perspective: individual
  focus: patient
  description: "How a patient remains protected during a regional electricity failure."

  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity hospital "Hospital" {
    kind: healthcare
    layer: municipality
    supports: [injury, illness]
    failure-modes: [operators, system-externalities]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
    failure-modes: [time-and-wear, system-externalities, violence-or-disaster]
  }

  entity generator "Backup generator" {
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
    requirement-group: generator-fuel
    requirement-service: diesel
    requirement-policy: all
    when-unsatisfied: failed
  }

  hospital -> patient {
    id: hospital-patient
    kind: protects
    critical: true
    service-effects: [provision, quality]
    requirement-group: patient-care
    requirement-service: emergency-care
    requirement-policy: all
    when-unsatisfied: failed
  }

  scenario grid-failure "Regional grid failure with working backup" {
    set grid status failed
    set relationship grid-hospital status failed
    set generator status normal
  }

  scenario total-power-loss "Grid and backup generator unavailable" {
    set grid status failed
    set relationship grid-hospital status failed
    set generator status failed
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
    place hospital at 370 420 size 120 40
    place generator at 615 430 size 120 40
    place grid at 720 290 size 120 40
    place fuel-depot at 780 520 size 110 40

    route grid-hospital via 720 290, 560 340, 370 420
    route generator-hospital via 615 430, 500 425, 370 420
    route fuel-generator via 780 520, 700 475, 615 430
    route hospital-patient via 370 420, 440 460, 500 500
  }
}
```

## Assumptions

- Either the regional grid or the backup generator can meet the modelled hospital electricity requirement.
- The generator starts successfully when grid power fails.
- The stated fuel endurance assumes normal hospital demand.
- Fuel resupply depends on the road network, which is not yet represented.

## Open questions

- Which clinical services fail first as power quality degrades?
- Is generator fuel shared with any other organisation?
- How quickly can the depot deliver during a regional emergency?
