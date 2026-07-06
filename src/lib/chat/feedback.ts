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
      /\b(is missing|you don'?t have|there'?s no option|no option (to|for)|doesn'?t exist|not available|you haven'?t added)\b/i,
      /\b(?:can'?t|cannot|unable to) (find|locate|select|choose|add|enter|change|update|pay)\b/i,
    ],
  },
  {
    category: "complaint",
    patterns: [
      /\b(doesn'?t work|does not work|not working|broken|bug|glitch|problem|error|too slow|too expensive|overpriced)\b/i,
      /\b(disappointed|unhappy|complain(?:t|ing)?|don'?t like|frustrating|complicated)\b/i,
    ],
  },
  {
    category: "request",
    patterns: [
      /\b(it would be (?:good|great|nice|helpful)|i(?:'d| would) (?:like|love)|i wish (?:you|there))\b/i,
      /\byou should (?:have|add|offer|enable|include|support)\b/i,
      /\b(?:can|could) you (?:add|include|enable|support)\b/i,
    ],
  },
  {
    category: "confusion",
    patterns: [
      /\b(i don'?t understand|don'?t get it|not clear|unclear|confus(?:ed|ing)|where (?:is|do i|can i)|how (?:do|can) i)\b/i,
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
      return "Complaint";
    case "missing_feature":
      return "Missing feature";
    case "request":
      return "Request";
    case "confusion":
      return "Confusion";
    default:
      return category;
  }
}
