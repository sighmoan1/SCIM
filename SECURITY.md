# Security policy

## Scope

SCIM models may describe infrastructure dependencies, failure modes, service endurance, operational assumptions and response plans. Even when the software itself is public, a particular model may be sensitive.

Security therefore covers both application vulnerabilities and unsafe handling of infrastructure information.

## Reporting a vulnerability

Do not publish an exploitable security issue, credential, private infrastructure dataset or operational vulnerability in a public issue.

Use GitHub’s private vulnerability-reporting feature when enabled for the repository, or contact the repository owner privately through an established trusted channel. Include:

- affected version and commit;
- route or component;
- reproduction steps;
- impact;
- proof of concept using synthetic data;
- suggested mitigation where known.

Do not access, modify or disclose real data beyond what is necessary to demonstrate the issue safely.

## Sensitive model content

Before storing or sharing a SCIM model, consider whether it contains:

- precise infrastructure locations;
- access routes or credentials;
- capacities, stocks or endurance times;
- single points of failure;
- unpatched vulnerabilities;
- security or emergency procedures;
- personal information;
- confidential evidence;
- operational plans or contact details;
- information whose combination is more sensitive than any individual item.

Use synthetic examples in the public repository, screenshots, tests and issue reports.

## Browser-local storage

The current workspace stores the accepted document and revision history in browser local storage.

This means:

- SCIM does not encrypt the data;
- anyone with access to the browser profile may be able to inspect it;
- browser clearing may delete it;
- device backup or synchronisation may copy it outside SCIM’s control;
- local storage is not suitable as the only record or as a high-assurance secret store.

Export portable SCIM for deliberate backup and apply the organisation’s data-handling rules.

## External AI disclosure

The core application does not automatically send a model to an AI provider. The user deliberately copies a handoff or proposal request.

Before pasting into an external service, review:

- the complete text-only structural reading;
- the authoritative SCIM source;
- evidence and source links;
- assumptions and vulnerabilities;
- scenario and action-plan content;
- the provider’s data retention, training and access terms.

A future embedded provider integration must:

- show what data will be sent;
- name the provider and model;
- require an explicit user action;
- document retention and training behaviour where known;
- keep provider credentials server-side or otherwise protected;
- prevent the provider from writing accepted state directly;
- preserve local or provider-neutral alternatives.

## Untrusted input

Treat imported SCIM, Markdown, JSON and AI responses as untrusted.

Required controls:

- parse through the SCIM parser;
- validate through `ScimDocumentSchema`;
- escape text inserted into HTML or SVG;
- avoid executing attributes or embedded code;
- impose reasonable file and text-size limits when import expands;
- reject malformed references and invalid partial proposals;
- do not trust filenames, MIME types or Markdown prose;
- review generated SVG for injection risks when renderer capability expands.

## Rendering

The deterministic SVG renderer should generate SVG from validated canonical fields and escape all user-controlled text.

Do not allow arbitrary SVG, HTML, CSS, JavaScript or URL attributes to pass through model extensions into rendered output.

`dangerouslySetInnerHTML` is used to display renderer-generated SVG. This makes renderer escaping and strict generation especially important.

## Credentials and secrets

Never commit:

- API keys;
- Vercel tokens;
- GitHub tokens;
- database credentials;
- authentication secrets;
- operational system credentials;
- real `.env` files.

Document required variables in `.env.example` with placeholder values.

## Dependencies

Framework and parsing dependencies are security-sensitive.

- Keep Next.js on a patched supported release.
- Do not bypass Vercel’s vulnerable-framework deployment block.
- Review dependency advisories.
- Inspect pnpm build-script approvals before enabling them.
- Avoid broad unreviewed dependency upgrades.
- Keep lockfile and package-manager behaviour consistent across local, CI and Vercel environments.

## Cloud collaboration requirements

Before adding server persistence or multi-user collaboration, define:

- authentication and account recovery;
- project and object permissions;
- encryption in transit and at rest;
- data location and retention;
- audit logging;
- tenant isolation;
- deletion and export;
- incident response;
- secrets management;
- backup and recovery;
- AI-provider disclosure;
- handling of highly sensitive projects.

Do not treat a generic database connection as completion of these requirements.

## Operational use

SCIM is a modelling and planning tool, not an authoritative operational control system.

Users should verify:

- dependencies;
- endurance and capacity;
- restoration assumptions;
- ownership and responsibility;
- scenario logic;
- recommended actions.

AI-generated content must be reviewed by people with suitable domain and operational knowledge before it affects real decisions.

## Security review triggers

A focused security review is required for changes involving:

- authentication or accounts;
- server or cloud storage;
- sharing links;
- external AI APIs;
- file upload or document import;
- arbitrary Markdown or SVG display;
- telemetry or analytics;
- operational data connectors;
- public project publishing;
- permissions or audit history;
- executable simulation plugins;
- secrets or environment variables.

## Supported versions

The project is currently pre-1.0. Security fixes are applied to the current `main` branch and current deployed application. Older preview deployments and historical branches are not maintained as supported releases.