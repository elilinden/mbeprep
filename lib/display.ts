const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "nor", "of", "on", "or", "the", "to", "with"]);

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();

      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }

      if (/^[A-Z0-9]{2,}$/.test(word) || word.includes("'")) {
        return word;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function cleanTopicTitle(value: string) {
  const [first, ...rest] = value.split(/\s+-\s+/);
  const focus = rest.length ? rest.join(" - ") : first;
  return titleCase(focus)
    .replace(/\bWho Withdraws and Communicates Withdrawal\b/g, "and Withdrawal")
    .replace(/\bAfter Abandonment\b/g, "after Abandonment")
    .replace(/\s+/g, " ")
    .trim();
}

export function trapTitle(value: string) {
  const [firstSentence] = value.split(/(?<=[.!?])\s+/);
  const [firstClause] = firstSentence.split(/\s+-\s+|:\s+/);
  return cleanTopicTitle(firstClause || value);
}
