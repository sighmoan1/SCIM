/**
 * Canonical SCIM taxonomy, faithful to "Dealing in Security" (Gupta & Bennett,
 * 2010): the four tiers of cooperation, the eighteen critical needs grouped by
 * tier, the seven layers of infrastructure provision, and the four service
 * delivery paths.
 *
 * This is the canonical model. Everything else in the app (the six-ways-to-die
 * dashboard, the radial map, the INAM matrix) is a view over it. Supplementary
 * material (FluSCIM substitution strategies, OODA, AI practice) uses this
 * taxonomy but does not define it.
 *
 * Need identifiers match `STANDARD_SCIM_NEEDS` in schema.ts.
 */

export type TierId = "individual" | "group" | "organisation" | "nation-state";

export interface Tier {
  id: TierId;
  label: string;
  /** One-line description of the tier from Dealing in Security. */
  summary: string;
  /** Ordered canonical need ids for this tier. */
  needs: string[];
}

export interface CanonicalNeed {
  id: string;
  label: string;
  tier: TierId;
  /** Plain-language prompt used when authoring what meets this need. */
  question: string;
  /** Examples of what typically meets it. */
  hint: string;
}

/**
 * The four tiers of cooperation. Each tier rests on the infrastructure of the
 * tiers below it: individuals make up groups, groups form organisations,
 * organisations constitute the nation-state, and the state provides services
 * back to individual citizens.
 */
export const TIERS: Tier[] = [
  {
    id: "individual",
    label: "Individual",
    summary: "One person, protected from the six ways to die.",
    needs: ["too-hot", "too-cold", "hunger", "thirst", "illness", "injury"],
  },
  {
    id: "group",
    label: "Group",
    summary: "Any collection of people — a family, a team, a neighbourhood.",
    needs: ["communications", "transport", "space", "resource-control"],
  },
  {
    id: "organisation",
    label: "Organisation",
    summary:
      "A group with a purpose beyond its members — a hospital, utility, agency.",
    needs: ["shared-map", "shared-plan", "shared-succession"],
  },
  {
    id: "nation-state",
    label: "Nation-state",
    summary: "The state that provides services to all its citizens.",
    needs: [
      "jurisdiction",
      "citizens",
      "territory",
      "effective-organisations",
      "international-recognition",
    ],
  },
];

export const CANONICAL_NEEDS: CanonicalNeed[] = [
  // Individual — the six ways to die.
  {
    id: "too-hot",
    label: "Too hot",
    tier: "individual",
    question: "What keeps this person cool in dangerous heat?",
    hint: "Cooling, shade, ventilation, somewhere cooler to go.",
  },
  {
    id: "too-cold",
    label: "Too cold",
    tier: "individual",
    question: "What keeps this person warm in dangerous cold?",
    hint: "Heating, clothing, blankets, a warm place to go.",
  },
  {
    id: "hunger",
    label: "Hunger",
    tier: "individual",
    question: "Where does their food come from?",
    hint: "Shops, home stores, community support, local production.",
  },
  {
    id: "thirst",
    label: "Thirst",
    tier: "individual",
    question: "Where does their drinking water come from?",
    hint: "Tap water, stored water, another safe local source.",
  },
  {
    id: "illness",
    label: "Illness",
    tier: "individual",
    question: "Who treats them when they are ill?",
    hint: "GP or clinic, pharmacy, hospital, home medicines.",
  },
  {
    id: "injury",
    label: "Injury",
    tier: "individual",
    question: "Who helps them when they are hurt?",
    hint: "Emergency department, ambulance, first aid, police.",
  },
  // Group.
  {
    id: "communications",
    label: "Communications",
    tier: "group",
    question: "How does the group exchange messages?",
    hint: "Phones, internet, radio, mail, in person — ideally more than one.",
  },
  {
    id: "transport",
    label: "Transport",
    tier: "group",
    question: "How do people and resources move?",
    hint: "Walking, vehicles, fuel, ports, airports.",
  },
  {
    id: "space",
    label: "Space",
    tier: "group",
    question: "Where does the group gather and work?",
    hint: "A home, an office, a cafe, a depot.",
  },
  {
    id: "resource-control",
    label: "Resource control",
    tier: "group",
    question: "How are shared resources managed?",
    hint: "Sharing, rotas, rules, administration.",
  },
  // Organisation — social infrastructure.
  {
    id: "shared-map",
    label: "Shared map",
    tier: "organisation",
    question: "Do members share a picture of reality and aims?",
    hint: "What is happening, what must be done, the correct way to do it.",
  },
  {
    id: "shared-plan",
    label: "Shared plan",
    tier: "organisation",
    question: "Is there a shared plan of who does what?",
    hint: "Activities of groups and individuals, adaptable under crisis.",
  },
  {
    id: "shared-succession",
    label: "Shared succession",
    tier: "organisation",
    question: "How is leadership replaced when people are lost?",
    hint: "Who steps up if leaders are ill, absent or unable to act.",
  },
  // Nation-state.
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    tier: "nation-state",
    question: "Is there effective law and law enforcement?",
    hint: "Legal rules, courts, enforcement.",
  },
  {
    id: "citizens",
    label: "Citizens",
    tier: "nation-state",
    question: "Can the state identify its own people?",
    hint: "Population lists, identity records.",
  },
  {
    id: "territory",
    label: "Territory",
    tier: "nation-state",
    question: "Is there an agreed area the state controls?",
    hint: "Borders, territorial maps, land registries.",
  },
  {
    id: "effective-organisations",
    label: "Effective organisations",
    tier: "nation-state",
    question: "Do the arms of the state function?",
    hint: "Police, army, courts, health, essential-service bodies.",
  },
  {
    id: "international-recognition",
    label: "International recognition",
    tier: "nation-state",
    question: "Is the state recognised by others?",
    hint: "Consent of the governed, standing with international bodies.",
  },
];

export const CANONICAL_NEED_IDS: string[] = CANONICAL_NEEDS.map(
  (need) => need.id
);

const NEED_BY_ID = new Map(CANONICAL_NEEDS.map((need) => [need.id, need]));

export function canonicalNeed(id: string): CanonicalNeed | undefined {
  return NEED_BY_ID.get(id);
}

export function needsForTier(tier: TierId): CanonicalNeed[] {
  return CANONICAL_NEEDS.filter((need) => need.tier === tier);
}

/**
 * The seven layers of infrastructure ownership/provision, plus the island layer
 * that archipelagos need (Dealing in Security, "Layers of infrastructure").
 * Ordered nearest-to-furthest; used to place providers and to read each need
 * horizontally across levels.
 */
export interface Layer {
  id: string;
  label: string;
  /** Alternate ids accepted from imported/legacy models. */
  aliases?: string[];
}

export const LAYERS: Layer[] = [
  { id: "individual", label: "Individual" },
  { id: "household", label: "Household" },
  {
    id: "neighbourhood",
    label: "Neighbourhood / village",
    aliases: ["neighborhood", "village"],
  },
  {
    id: "municipality",
    label: "Town / city / municipality",
    aliases: ["town", "city"],
  },
  { id: "island", label: "Island" },
  { id: "region", label: "Region" },
  { id: "country", label: "Country", aliases: ["nation", "national"] },
  { id: "world", label: "International", aliases: ["international", "global"] },
];

export const LAYER_ORDER: string[] = LAYERS.map((layer) => layer.id);

const LAYER_BY_ANY = new Map<string, Layer>();
for (const layer of LAYERS) {
  LAYER_BY_ANY.set(layer.id, layer);
  for (const alias of layer.aliases ?? []) LAYER_BY_ANY.set(alias, layer);
}

export function normaliseLayer(value: string): string {
  return LAYER_BY_ANY.get(value)?.id ?? value;
}

export function layerRank(value: string): number {
  const index = LAYER_ORDER.indexOf(normaliseLayer(value));
  return index === -1 ? LAYER_ORDER.length : index;
}

export function layerLabel(value: string): string {
  return LAYER_BY_ANY.get(value)?.label ?? value;
}

/**
 * The four service delivery paths (Dealing in Security, "Service delivery
 * paths"). A vital service can often be obtained by more than one path, which
 * is the basis for substitution when the usual path fails.
 */
export interface DeliveryPath {
  id: "on-site" | "grid" | "delivery" | "fetch";
  label: string;
  hint: string;
}

export const DELIVERY_PATHS: DeliveryPath[] = [
  { id: "on-site", label: "Produce on site", hint: "e.g. a well, solar, a generator." },
  { id: "grid", label: "Grid", hint: "e.g. mains power, piped water." },
  { id: "delivery", label: "Delivery", hint: "e.g. a water tanker, fuel delivery." },
  { id: "fetch", label: "Fetch", hint: "e.g. shopping, carrying water from a source." },
];
