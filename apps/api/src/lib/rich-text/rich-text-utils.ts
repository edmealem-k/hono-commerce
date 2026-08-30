export function stripRichTextHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasMeaningfulRichText(
  value: string | null | undefined,
): boolean {
  return stripRichTextHtml(value).length > 0;
}
