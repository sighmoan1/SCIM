import fs from "node:fs";

const file = "components/home-dashboard.tsx";
let source = fs.readFileSync(file, "utf8");

function replace(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Missing mobile-home pattern: ${label}`);
  source = next;
}

replace(
  '    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6" aria-hidden="true">',
  '    <div className="mobile-home-shell space-y-5" aria-hidden="true">',
  "skeleton shell"
);
replace(
  '      <div className="flex items-center gap-6 rounded-3xl bg-card p-6 shadow-soft ring-1 ring-inset ring-border/60">',
  '      <div className="mobile-hero-layout rounded-[1.75rem] bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60">',
  "skeleton hero"
);
replace(
  '        <div className="h-[168px] w-[168px] shrink-0 animate-pulse rounded-full bg-muted" />',
  '        <div className="h-[116px] w-[116px] shrink-0 animate-pulse rounded-full bg-muted" />',
  "skeleton ring"
);
source = source.replaceAll(
  'className="grid gap-2.5 sm:grid-cols-2"',
  'className="grid desktop-grid-2 gap-3"'
);
source = source.replaceAll(
  'className="grid items-start gap-2.5 sm:grid-cols-2"',
  'className="grid desktop-grid-2 items-start gap-3"'
);
replace(
  '  const anyFailure = counts.atRisk + counts.unprotected > 0;\n',
  `  const anyFailure = counts.atRisk + counts.unprotected > 0;
  const higherTierTotals = tierAssessment.tiers
    .filter((tier) => tier.tier !== "individual")
    .reduce(
      (totals, tier) => ({
        mapped: totals.mapped + tier.needs.length - tier.counts.unmapped,
        total: totals.total + tier.needs.length,
      }),
      { mapped: 0, total: 0 }
    );
`,
  "higher tier totals"
);
replace(
  '    <div className="rise-in mx-auto max-w-3xl space-y-7 px-4 py-6">',
  '    <div className="mobile-home-shell rise-in space-y-5">',
  "home shell"
);
replace(
  '      <section className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-inset ring-border/60">',
  '      <section className="rounded-[1.75rem] bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60">',
  "hero card"
);
replace(
  '        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-7 sm:text-left">',
  '        <div className="mobile-hero-layout">',
  "hero layout"
);
replace(
  '          <ResilienceRing needs={assessment.needs} />',
  '          <ResilienceRing needs={assessment.needs} size={116} />',
  "compact ring"
);
replace(
  '            <h1 className="text-[1.6rem] font-bold leading-tight">',
  '            <h1 className="text-[1.35rem] font-bold leading-tight sm:text-[1.6rem]">',
  "hero heading"
);
replace(
  '              <span className="text-xs text-muted-foreground/70">\n                 {family.summary}\n               </span>',
  '              <span className="hidden text-xs text-muted-foreground/70 min-[420px]:inline">\n                 {family.summary}\n               </span>',
  "family summary"
);
replace(
  /      \{\/\* The four tiers of cooperation \*\/\}[\s\S]*?      \{\/\* Primary actions \*\/\}/,
  `      {/* Wider cooperative system */}
      <section className="rounded-[1.5rem] bg-card p-4 shadow-soft ring-1 ring-inset ring-border/60">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold">Build the wider system</h2>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {higherTierTotals.mapped}/{higherTierTotals.total}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
              Map the groups, organisations and public systems that keep the whole community functioning.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Button asChild className="min-h-12 rounded-xl font-semibold">
            <Link href="/build">
              <Layers className="mr-2 h-4 w-4" aria-hidden="true" />
              Add systems
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-12 rounded-xl font-semibold">
            <Link href="/matrix">
              <Grid3x3 className="mr-2 h-4 w-4" aria-hidden="true" />
              Open Matrix
            </Link>
          </Button>
        </div>
      </section>

      {/* Primary actions */}`,
  "replace four-tier grid"
);
replace(
  '      <section className="grid gap-2.5 sm:grid-cols-2">',
  '      <section className="mobile-sticky-actions grid grid-cols-2 gap-2.5">',
  "sticky actions"
);
replace(
  '            Something just failed',
  '            Report failure',
  "emergency label"
);
replace(
  '            See the full map',
  '            Open map',
  "map label"
);
replace(
  'className="pressable h-13 min-h-[3.25rem] rounded-2xl bg-danger text-base font-semibold text-white shadow-soft hover:bg-danger/90"',
  'className="pressable min-h-14 rounded-2xl bg-danger px-3 text-sm font-semibold text-white shadow-soft hover:bg-danger/90 sm:text-base"',
  "emergency button"
);
replace(
  'className="pressable h-13 min-h-[3.25rem] rounded-2xl bg-card text-base font-semibold shadow-soft"',
  'className="pressable min-h-14 rounded-2xl bg-card px-3 text-sm font-semibold shadow-soft sm:text-base"',
  "map button"
);

fs.writeFileSync(file, source);
console.log("Applied mobile-first Home redesign.");
