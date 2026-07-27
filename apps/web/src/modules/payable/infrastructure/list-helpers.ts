/** Strip characters that break PostgREST `.or()` / `ilike` filters. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,.()"'\\]/g, ' ')
    .replace(/%/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function encodeListCursor(value: string, id: string): string {
  return `${encodeURIComponent(value)}::${id}`
}

export function decodeListCursor(
  cursor: string,
): { value: string; id: string } | null {
  const sep = cursor.lastIndexOf('::')
  if (sep <= 0) return null
  try {
    return {
      value: decodeURIComponent(cursor.slice(0, sep)),
      id: cursor.slice(sep + 2),
    }
  } catch {
    return null
  }
}
