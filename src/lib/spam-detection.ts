/**
 * spam-detection.ts — heuristic classification of incoming inquiries.
 *
 * Pure, side-effect free, no server-only imports, so it can be imported by
 * a tsx script (triage), a server component (admin panel), and a server
 * action alike. No ML — every signal is explainable and returned in
 * `reasons[]` so a non-technical staffer understands WHY something was
 * flagged.
 *
 * The goal is NOT auto-rejection (a false positive must never lose a real
 * lead), but to surface spam to the top of attention and keep staff wary of
 * links and attachments. The site is a French arch-viz B2C — a legit
 * inquiry almost never contains links or SEO/marketing jargon, so those are
 * strong signals. Keyword lists carry both French and English patterns
 * (spam reaching .fr arrives in either language).
 *
 * The bot signals that caught the 2026-07 wave (random name token, Gmail
 * dot-trick address) are language-neutral and unchanged from the .rs
 * original; only the domain vocabulary and reason strings are localized.
 */

export type SpamLevel = "clean" | "suspicious" | "likely_spam";

export type SpamSignalInput = {
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  serviceType?: string | null;
};

export type SpamResult = {
  score: number;
  level: SpamLevel;
  reasons: string[];
};

// Thresholds: 0 → clean, 1–2 → suspicious, ≥3 → likely_spam.
const SUSPICIOUS_AT = 1;
const LIKELY_SPAM_AT = 3;

// Domain terms — if a message contains them, that's a signal it IS a real
// inquiry (used to soften the link signal, not as a standalone penalty).
const DOMAIN_TERMS = [
  "render",
  "interior",
  "exterior",
  "360",
  "tour",
  "animat", // animation / animate / animated
  "apartment",
  "flat",
  "house",
  "villa",
  "project",
  "floor plan",
  "floorplan",
  "layout",
  "m2",
  "sqm",
  "square met", // square meter / metre / meters
  "furnish", // furnishing / furnished
  "renovat", // renovation / renovate
  "remodel",
  "architec", // architect / architecture / architectural
  "visuali", // visualization / visualisation / visualize
  "blueprint",
  "room",
  "kitchen",
  "bathroom",
  "bedroom",
  "space",
  "facade",
  "façade",
  "plot",
  "building",
  "staging", // virtual staging
  "dusk", // day-to-dusk
  "photomontage",
  "vr",
  // French equivalents (matched on diacritic-stripped lowercase text,
  // so accents are written out): a legit French inquiry mentions the
  // space or the render in these words.
  "rendu",
  "interieur",
  "exterieur",
  "appartement",
  "maison",
  "projet",
  "etage",
  "piece",
  "cuisine",
  "salle de bain",
  "chambre",
  "salon",
  "espace",
  "batiment",
  "immeuble",
  "terrain",
  "amenagement",
  "meubl", // meuble / meubler / meublee
  "visite",
  "crepuscule",
  "surface",
  "perspective",
  "maquette",
];

// English/French/Russian marketing and scam phrases. Each unique hit +1
// (total contribution capped at MAX_KEYWORD_WEIGHT).
const SPAM_KEYWORDS = [
  "seo",
  "backlink",
  "back link",
  "link building",
  "link-building",
  "guest post",
  "guest-post",
  "ranking",
  "rank your",
  "rank higher",
  "search engine",
  "google ranking",
  "traffic to your",
  "increase your",
  "boost your",
  "grow your",
  "web design services",
  "website design",
  "web development",
  "mobile app development",
  "digital marketing",
  "i came across your",
  "i visited your website",
  "i found your website",
  "cheap price",
  "best price",
  "make money",
  "work from home",
  "crypto",
  "bitcoin",
  "forex",
  "investment opportunity",
  "casino",
  "loan",
  "viagra",
  "cialis",
  "escort",
  "dear sir",
  "dear sir/madam",
  "dear owner",
  "sponsorship",
  "collaboration opportunity",
  // French marketing/scam phrases. The haystack is lowercased but NOT
  // diacritic-stripped, so accented and unaccented spellings are both
  // listed where they differ.
  "référencement",
  "referencement",
  "netlinking",
  "article invité",
  "article invite",
  "création de site",
  "creation de site",
  "conception de site",
  "agence web",
  "développement web",
  "developpement web",
  "marketing digital",
  "augmentez votre",
  "boostez votre",
  "visité votre site",
  "visite votre site",
  "meilleur prix",
  "prix imbattable",
  "gagner de l'argent",
  "gagner de l’argent",
  "travail à domicile",
  "travail a domicile",
  "opportunité de collaboration",
  "opportunite de collaboration",
];

// Known disposable / one-shot email domains.
const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
];

const MAX_KEYWORD_WEIGHT = 3;
const MAX_LINK_WEIGHT = 3;

/** Strip diacritics for robust term matching (Latin accents, Serbian). */
function stripDiacritics(s: string): string {
  return s
    .replace(/[àáâãäåāă]/g, "a")
    .replace(/[èéêëēėę]/g, "e")
    .replace(/[ìíîïī]/g, "i")
    .replace(/[òóôõöō]/g, "o")
    .replace(/[ùúûüū]/g, "u")
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj");
}

/** Count URL/link tokens in text (protocol, www, or suspicious bare TLD). */
function countLinks(text: string): number {
  const explicit = text.match(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [];
  if (explicit.length > 0) return explicit.length;
  // No explicit protocol — a bare domain with a common spam TLD.
  const bare =
    text.match(
      /\b[a-z0-9-]{2,}\.(?:ru|xyz|top|online|site|club|click|link|shop|store|live|icu|tk|ml|ga|cf|gq|buzz|monster|loan|work|info|biz)\b/gi,
    ) ?? [];
  return bare.length;
}

function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase().trim();
}

/**
 * Graded signal for the name. Bots fill the name with a random string
 * (e.g. "ACrtEgjxchoDBGHzGk") — a single long token with random upper/
 * lowercase is almost certainly a bot and carries more weight than milder
 * anomalies (no vowels, digits in the name).
 */
function nameSpamSignal(name: string): { weight: number; reason: string | null } {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { weight: 0, reason: null };
  const letters = trimmed.replace(/[^a-zčćšžđA-ZČĆŠŽĐ]/g, "");
  let transitions = 0;
  for (let i = 1; i < letters.length; i++) {
    const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase();
    const curUpper = letters[i] === letters[i].toUpperCase();
    if (prevUpper !== curUpper) transitions++;
  }
  const single = !/\s/.test(trimmed);
  const noVowel =
    letters.length >= 6 && !/[aeiou]/.test(stripDiacritics(letters.toLowerCase()));

  // A single long token with many case transitions = bot handle.
  if (single && letters.length >= 10 && transitions >= 4) {
    return { weight: 3, reason: "le nom est une chaîne aléatoire (bot)" };
  }
  if (noVowel || /\d/.test(trimmed) || transitions >= 4) {
    return { weight: 1, reason: "le nom semble aléatoire" };
  }
  return { weight: 0, reason: null };
}

/**
 * Gmail "dot trick": Gmail ignores dots in the local part, so bots generate
 * many variants of the same address (a.b.c.d@gmail.com). ≥3 dots in a
 * gmail/googlemail local part is a strong bot signal; real users rarely
 * have more than one.
 */
function gmailDotTrick(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false;
  return (local.match(/\./g) ?? []).length >= 3;
}

export function scoreInquiry(input: SpamSignalInput): SpamResult {
  const reasons: string[] = [];
  let score = 0;

  const message = String(input.message ?? "");
  const messageLower = message.toLowerCase();
  const messageNoDia = stripDiacritics(messageLower);
  const name = String(input.contactName ?? "");
  const email = String(input.email ?? "").toLowerCase();
  const phone = String(input.phone ?? "").trim();
  const company = String(input.company ?? "");
  const haystack = `${messageLower} ${company.toLowerCase()}`;

  // 1) Links in the message/company — the strongest single signal.
  const linkCount = countLinks(`${message} ${company}`);
  if (linkCount > 0) {
    const w = Math.min(linkCount, MAX_LINK_WEIGHT);
    score += w;
    reasons.push(
      linkCount === 1
        ? "contient un lien dans le message"
        : `contient ${linkCount} liens dans le message`,
    );
  }

  // 2) Marketing/spam keywords.
  const matchedKeywords = SPAM_KEYWORDS.filter((k) => haystack.includes(k));
  if (matchedKeywords.length > 0) {
    const w = Math.min(matchedKeywords.length, MAX_KEYWORD_WEIGHT);
    score += w;
    reasons.push(
      `mots-clés marketing/spam : ${matchedKeywords.slice(0, 4).join(", ")}`,
    );
  }

  // 3) Russian text — neither French nor English uses Cyrillic ы/э/ъ/ё.
  if (/[ыэъёЫЭЪЁ]/.test(message)) {
    score += 2;
    reasons.push("texte en russe (cyrillique ы/э/ъ/ё)");
  }

  // 4) Disposable email domain.
  const domain = emailDomain(email);
  if (domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    score += 2;
    reasons.push(`domaine e-mail jetable (${domain})`);
  }

  // 4b) Gmail dot-trick (bot dedup evasion).
  if (gmailDotTrick(email)) {
    score += 2;
    reasons.push("astuce des points Gmail dans l’adresse (bot)");
  }

  // 5) The message mentions ANOTHER email address (spammers drop a contact
  // in the body text).
  const inlineEmails = message.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) ?? [];
  const otherEmail = inlineEmails.find(
    (e) => e.toLowerCase() !== email && e.length < 120,
  );
  if (otherEmail) {
    score += 1;
    reasons.push("une autre adresse e-mail dans le corps du message");
  }

  // 6) Random/bot name.
  const nameSig = nameSpamSignal(name);
  if (nameSig.weight > 0 && nameSig.reason) {
    score += nameSig.weight;
    reasons.push(nameSig.reason);
  }

  // 7) Compound: link + no domain terms + no phone → bot brief.
  const hasDomainTerm = DOMAIN_TERMS.some((t) => messageNoDia.includes(t));
  if (linkCount > 0 && !hasDomainTerm) {
    score += 1;
    reasons.push("lien sans aucun terme lié au rendu ou à l’espace");
  }
  if (linkCount > 0 && !phone) {
    score += 1;
    reasons.push("lien avec téléphone non renseigné");
  }

  const level: SpamLevel =
    score >= LIKELY_SPAM_AT
      ? "likely_spam"
      : score >= SUSPICIOUS_AT
        ? "suspicious"
        : "clean";

  return { score, level, reasons };
}

/** Short label for a level — used by both the admin panel and email. */
export function spamLevelLabel(level: SpamLevel): string {
  switch (level) {
    case "likely_spam":
      return "Spam probable";
    case "suspicious":
      return "Suspect";
    default:
      return "Sain";
  }
}
