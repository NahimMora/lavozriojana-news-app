export function escapeXml(value: unknown) {
  return String(value ?? '').replace(/[<>&'"]/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return map[char];
  });
}

export function formatRssDate(date: Date | string | null | undefined) {
  return date ? new Date(date).toUTCString() : new Date().toUTCString();
}
