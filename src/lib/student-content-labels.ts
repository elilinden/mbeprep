const demoPrefixPattern = /^DEMO_NOT_FOR_PUBLICATION\s*/i;

export function toStudentContentLabel(value: string) {
  return value.replace(demoPrefixPattern, "").trim() || value;
}
