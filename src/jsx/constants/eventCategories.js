import { Calendar, Users, Award } from "lucide-react";

// Taxonomy option lists and per-category configuration for the event-creation wizard
// (CategoryPicker → TaxonomyStepFields → OrganizationProfileFields). Confirmed design:
// docs/event-creation-wizard-design.md. Every option list ends with "Other" so no real-world case
// is left unrepresented — extending a category later is just editing an array here, no wizard
// changes needed (existing events without these keys simply have nothing to show, see
// eventCard.jsx).

const OTHER_OPTION = { value: "other", label: "Other" };

const EVENT_TAXONOMY = {
  orgType: {
    label: "Organizer type",
    options: [
      { value: "company", label: "Company" },
      { value: "ngo", label: "Nonprofit / NGO" },
      { value: "educational", label: "Educational institution" },
      { value: "government", label: "Government / Public sector" },
      { value: "community", label: "Informal community or group" },
      { value: "professional_independent", label: "Independent professional" },
      OTHER_OPTION,
    ],
  },
  modality: {
    label: "Format",
    options: [
      { value: "in_person", label: "In-person" },
      { value: "virtual", label: "Virtual" },
      { value: "hybrid", label: "Hybrid" },
      OTHER_OPTION,
    ],
  },
  purpose: {
    label: "Purpose",
    options: [
      { value: "reward_attendance", label: "Reward attendance" },
      { value: "measure_interest", label: "Gauge interest or participation" },
      { value: "certify_participation", label: "Certify participation" },
      { value: "networking", label: "Networking" },
      OTHER_OPTION,
    ],
  },
  eventType: {
    label: "Event type",
    options: [
      { value: "conference", label: "Conference / Talk" },
      { value: "workshop", label: "Workshop / Course" },
      { value: "meetup", label: "Social meetup" },
      { value: "concert", label: "Concert / Show" },
      { value: "fair", label: "Fair / Exhibition" },
      OTHER_OPTION,
    ],
  },
};

const SUBSCRIPTION_TAXONOMY = {
  entityType: {
    label: "Entity type",
    options: [
      { value: "person_creator", label: "Individual / Content creator" },
      { value: "brand", label: "Brand / Company" },
      { value: "community", label: "Organization / Community" },
      { value: "media", label: "Media outlet" },
      { value: "web3_project", label: "Web3 project or protocol" },
      OTHER_OPTION,
    ],
  },
  industry: {
    label: "Industry",
    options: [
      { value: "art", label: "Art" },
      { value: "music", label: "Music" },
      { value: "tech", label: "Technology" },
      { value: "finance", label: "Finance" },
      { value: "gaming", label: "Gaming" },
      { value: "education", label: "Education" },
      OTHER_OPTION,
    ],
  },
  relationship: {
    label: "Relationship",
    options: [
      { value: "free_follow", label: "Free follow" },
      { value: "membership", label: "Membership / Community" },
      OTHER_OPTION,
    ],
  },
};

const CREDENTIAL_TAXONOMY = {
  orgType: {
    label: "Organization type",
    options: [
      { value: "educational", label: "Educational institution" },
      { value: "corporate", label: "Corporate" },
      { value: "government", label: "Government / Public sector" },
      { value: "entertainment", label: "Event organizer / Entertainment" },
      OTHER_OPTION,
    ],
  },
  credentialType: {
    label: "Credential type",
    options: [
      { value: "identity_document", label: "Identity document" },
      { value: "diploma", label: "Diploma / Academic certificate" },
      { value: "ticket", label: "Event ticket" },
      { value: "legal_document", label: "Legal document / Contract" },
      { value: "employment_certificate", label: "Employment certificate" },
      { value: "private_documentation", label: "Private documentation" },
      OTHER_OPTION,
    ],
  },
};

// organizationProfileGateField/ExcludeValues: which taxonomy field (if any) decides whether the
// "Organization profile" step's ADDRESS sub-fields show — the step itself (and its Organizer Name
// field) is always shown regardless, see createEvent.jsx. null gateField (Credential) means always
// show the address too — that category's taxonomy has no "individual" option, credential issuers
// are always organizations.
export const EVENT_CATEGORIES = {
  event: {
    key: "event",
    label: "Event",
    headerTitle: "Create Event",
    shortDescription:
      "In-person or virtual — reward attendance or gauge interest. Anyone can join by minting their own POAP.",
    isPublicMint: true,
    taxonomy: EVENT_TAXONOMY,
    organizationProfileGateField: "orgType",
    organizationProfileExcludeValues: ["professional_independent"],
    icon: Calendar,
  },
  subscription: {
    key: "subscription",
    label: "Subscription",
    headerTitle: "Create Subscription",
    shortDescription:
      "Follow a person, brand, or community. Anyone can join by minting their own POAP, with no time limit.",
    isPublicMint: true,
    taxonomy: SUBSCRIPTION_TAXONOMY,
    organizationProfileGateField: "entityType",
    organizationProfileExcludeValues: ["person_creator"],
    icon: Users,
  },
  credential: {
    key: "credential",
    label: "Credential",
    headerTitle: "Create Credential",
    shortDescription:
      "Documents, tickets, or diplomas you issue yourself to specific wallets — nobody mints on their own.",
    isPublicMint: false,
    taxonomy: CREDENTIAL_TAXONOMY,
    organizationProfileGateField: null,
    organizationProfileExcludeValues: [],
    icon: Award,
  },
};

export const CHANNEL_TYPES = [
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "discord", label: "Discord" },
  { value: "social", label: "Social media" },
  OTHER_OPTION,
];

export function getCategoryConfig(categoryKey) {
  return categoryKey ? EVENT_CATEGORIES[categoryKey] || null : null;
}

export function getCategoryLabel(categoryKey) {
  return getCategoryConfig(categoryKey)?.label || null;
}

// { action, loading, done } for the subscriber-facing self-claim flow — the action button
// (eventCard.jsx) and the claim drawer's title/submit/toasts (createPoap.jsx) all read off this
// same triple so they never drift out of sync with each other. "Subscribe"/"Subscribing"/
// "Subscribed" is the default for everything except the two cases with a more specific real-world
// verb: following a person/brand/community (subscription category, free_follow relationship) and
// attending an in-person/hybrid event. modality/relationship are optional taxonomy fields, so a
// legacy event or one where the organizer skipped that question falls back to the generic triple.
export function getClaimActionLabel(metadata) {
  if (metadata?.category === "subscription" && metadata?.relationship === "free_follow") {
    return { action: "Follow", loading: "Following", done: "Following" };
  }
  if (metadata?.category === "event" && (metadata?.modality === "in_person" || metadata?.modality === "hybrid")) {
    return { action: "Attend", loading: "Attending", done: "Attended" };
  }
  return { action: "Subscribe", loading: "Subscribing", done: "Subscribed" };
}

// Breaks the category's taxonomy fields (e.g. "event" → orgType/modality/purpose/eventType) back
// into label+display-value pairs — used by eventCard.jsx's expanded-card quick-facts block and
// createPoap.jsx's claim-drawer info block, so both read the same organizer-answered context the
// same way. The flattened form is what serializeTaxonomyValues (below) wrote into metadata at
// creation time. "Other" values show the organizer's own free text instead of the literal "other"
// option label. Legacy events without a category, or without a category recognized by the current
// EVENT_CATEGORIES config, simply have nothing to show — same "tolerate absence" approach used
// throughout this metadata layer.
export function getTaxonomyEntries(categoryKey, metadata) {
  const category = getCategoryConfig(categoryKey);
  if (!category || !metadata) return [];
  return Object.entries(category.taxonomy)
    .map(([field, def]) => {
      const value = metadata[field];
      if (!value) return null;
      const displayValue =
        value === "other"
          ? metadata[`${field}Other`] || "Other"
          : def.options.find((option) => option.value === value)?.label || value;
      return { field, label: def.label, value: displayValue };
    })
    .filter(Boolean);
}

// Whether the "Organization profile" step's ADDRESS sub-fields should show for the given category
// + the taxonomy values picked so far (the step itself, and its Organizer Name field, are always
// shown — see createEvent.jsx). Taxonomy fields are optional, so an unanswered gate field defaults
// to showing the address fields too — cheaper to offer a few extra optional inputs than to
// silently hide somewhere an organizer might have wanted to fill in.
export function isOrganizationProfileApplicable(categoryKey, taxonomyValues) {
  const category = getCategoryConfig(categoryKey);
  if (!category) return false;
  if (!category.organizationProfileGateField) return true;
  const gateValue = taxonomyValues?.[category.organizationProfileGateField];
  if (!gateValue) return true;
  return !category.organizationProfileExcludeValues.includes(gateValue);
}

// Flattens the answered taxonomy fields for a category into plain top-level metadata JSON keys —
// e.g. { modality: "in_person", purpose: "other", purposeOther: "Adoption fair" }. Unanswered
// (falsy) fields are omitted entirely rather than written as empty strings, same "tolerate
// absence" philosophy as the rest of the metadata JSON (see createEvent.jsx's handleSubmit).
export function serializeTaxonomyValues(categoryKey, taxonomyValues) {
  const category = getCategoryConfig(categoryKey);
  if (!category || !taxonomyValues) return {};
  const result = {};
  for (const field of Object.keys(category.taxonomy)) {
    const value = taxonomyValues[field];
    if (!value) continue;
    result[field] = value;
    if (value === "other") {
      const otherValue = taxonomyValues[`${field}Other`];
      if (otherValue) result[`${field}Other`] = otherValue;
    }
  }
  return result;
}
