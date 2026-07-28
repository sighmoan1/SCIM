# Hospital resilience

A minimal example showing narrative context alongside an editable SCIM model.

```scim
model hospital-resilience "Hospital resilience" {
  entity patient "Patient" {
    kind: person
    layer: individual
  }

  entity hospital "Hospital" {
    kind: healthcare
    layer: municipality
    protects-against: [injury, illness]
  }

  entity grid "Electricity grid" {
    kind: power
    layer: region
  }

  entity generator "Backup generator" {
    kind: power
    layer: municipality
    fuel-hours: 36
  }

  entity fuel-depot "Fuel depot" {
    kind: fuel
    layer: region
  }

  grid -> hospital {
    kind: supplies
    mode: grid
    critical: true
  }

  generator -> hospital {
    kind: backup-for
    mode: on-site
    critical: true
  }

  fuel-depot -> generator {
    kind: supplies
    mode: delivery
    critical: true
  }

  hospital -> patient {
    kind: protects
    critical: true
  }

  scenario grid-failure "Regional grid failure" {
    set grid status failed
    set generator status normal
  }
}
```

## Assumptions

- The generator starts successfully when grid power fails.
- The stated fuel endurance assumes normal hospital demand.
- Fuel resupply depends on the road network, which is not yet represented.

## Open questions

- Which clinical services fail first as power quality degrades?
- Is generator fuel shared with any other organisation?
- How quickly can the depot deliver during a regional emergency?
