## Purpose

What user or collaborator problem does this solve?

## Change type

Check every affected area:

- [ ] Semantic model
- [ ] Scenario model
- [ ] View or deterministic rendering
- [ ] Parser or serializer
- [ ] Simulation or dependency requirements
- [ ] Human/AI proposal and review workflow
- [ ] Persistence, revisions or migration
- [ ] Mobile or accessibility
- [ ] Legacy compatibility
- [ ] Documentation only

## Behaviour

Describe the accepted before and after behaviour. Name the canonical fields, routes or storage keys affected.

## Trust and safety

- Does this change what data can leave the browser?
- Can an AI write accepted state directly?
- Are assumptions, evidence and recommendations still distinguishable?
- Does imported or pasted content remain untrusted and validated?
- Are any sensitive infrastructure examples included?

## Compatibility

- Application version:
- SCIM schema compatibility:
- Renderer-profile compatibility:
- Local-storage migration:
- Legacy import/export impact:

## Mobile and accessibility

Describe mouse, touch, pen and keyboard checks. State any known screen-reader or narrow-layout limitations.

## Verification

- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Relevant automated tests
- [ ] GitHub Actions successful
- [ ] Vercel preview successful
- [ ] Desktop journey inspected
- [ ] Mobile journey inspected
- [ ] Proposal review inspected when relevant
- [ ] Scenario explanation inspected when relevant

## Documentation

- [ ] README updated for user-visible capability
- [ ] Architecture or subsystem guide updated
- [ ] Language/schema/renderer reference updated where relevant
- [ ] Roadmap limitations updated
- [ ] Changelog updated for release work
- [ ] ADR added or superseded for a durable decision

## Known limitations

State what this change deliberately does not solve.