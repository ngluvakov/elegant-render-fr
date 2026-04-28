export type ChatFeedbackSignal = {
  category: "complaint" | "missing_feature" | "request" | "confusion";
};

const SIGNALS: Array<{
  category: ChatFeedbackSignal["category"];
  patterns: RegExp[];
}> = [
  {
    category: "missing_feature",
    patterns: [
      /\b(nedostaje|fali|falite|nemate|nema opcij[aeu]|ne postoji|niste dodali)\b/i,
      /\b(ne mogu da (nadjem|nađem|izaberem|dodam|unesem|promenim|platim))\b/i,
    ],
  },
  {
    category: "complaint",
    patterns: [
      /\b(ne radi|bug|bag|problem|gre[šs]ka|lo[šs]e|sporo|preskupo|skupo)\b/i,
      /\b(nezadovoljan|nezadovoljna|[žz]alim se|ne svi[đd]a|komplikovano)\b/i,
    ],
  },
  {
    category: "request",
    patterns: [
      /\b(bilo bi dobro|voleo bih|volio bih|[žz]eleo bih|[žz]elio bih)\b/i,
      /\b(trebalo bi da (imate|dodate|omogu[ćc]ite|ubacite))\b/i,
      /\b(dodajte|ubacite|omogu[ćc]ite)\b/i,
    ],
  },
  {
    category: "confusion",
    patterns: [
      /\b(ne razumem|nije jasno|zbunjuje|zbunjuju[ćc]e|gde je|kako da)\b/i,
    ],
  },
];

export function detectChatFeedbackSignal(
  content: string,
): ChatFeedbackSignal | null {
  const text = content.trim();
  if (text.length < 8) return null;

  for (const signal of SIGNALS) {
    if (signal.patterns.some((pattern) => pattern.test(text))) {
      return { category: signal.category };
    }
  }

  return null;
}

export function chatFeedbackCategoryLabel(category: string): string {
  switch (category) {
    case "complaint":
      return "Kritika";
    case "missing_feature":
      return "Nedostaje opcija";
    case "request":
      return "Zahtev";
    case "confusion":
      return "Nejasnoća";
    default:
      return category;
  }
}
