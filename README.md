# Simple Critical Infrastructure Mapper (SCIM)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sighmoan1s-projects/v0-simple-infrastructure-mapper)

SCIM helps people understand how infrastructure and social organisation protect life, how services depend on one another, and what happens when those systems degrade or fail.

The application supports:

- the original radial SCIM mapping interface;
- a portable Markdown and Mermaid-like SCIM language;
- validated entities, dependencies, needs, failure modes and scenarios;
- frozen radial views that render deterministically as SVG;
- Integrated Needs Analysis Matrix (INAM) view data;
- portable AI handoffs that can be pasted into a chat and returned to the application without losing IDs or diagram geometry.

## Use

- `/` - original visual radial mapper
- `/editor` - portable SCIM source, validation, scenario application, deterministic radial preview and exports

## Language and architecture

- [`docs/scim-language.md`](docs/scim-language.md) - SCIM 0.2 language and semantic vocabulary
- [`docs/scim-radial-1.md`](docs/scim-radial-1.md) - normative deterministic radial SVG renderer
- [`docs/architecture.md`](docs/architecture.md) - application and human/AI collaboration architecture
- [`examples/hospital-resilience.scim.md`](examples/hospital-resilience.scim.md) - executable portable example

## License

This work is licensed under the Creative Commons Attribution-Noncommercial-Share Alike 2.0 UK: England & Wales License.
To view a copy of this license, visit [http://creativecommons.org/licenses/by-nc-sa/2.0/uk/](http://creativecommons.org/licenses/by-nc-sa/2.0/uk/) or send a letter to Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.

## Authors of SCIM [https://resiliencemaps.org](https://resiliencemaps.org)

**Mike Bennett**  
As founder managing director of Plain Software, Mike played a vital role in the development of NHS Direct. He is now a strategic consultant on social, business and government resilience.

**Vinay Gupta**  
Co-editor of _Small is Profitable_ (The Economist's book of the year 2003) and _Winning the Oil Endgame_, Vinay focusses on whole systems response to crisis and change mitigation.

**STAR-TIDES**  
SCIM is the underlying model for the US Department of Defense STAR-TIDES project on crisis response and humanitarian relief.  
(see Defense Horizons #70)
