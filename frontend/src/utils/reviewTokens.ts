export type ReviewToken = {
  start: number
  end: number
  text: string
}

export function getReviewTokens(text: string): ReviewToken[] {
  const regex = /[^,.;:\n]*\(\?\?\)/g
  const tokens: ReviewToken[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0]
    const leadingSpaces = raw.length - raw.trimStart().length
    const cleaned = raw.trim()

    if (cleaned.length === 0) continue

    const start = match.index + leadingSpaces
    const end = start + cleaned.length

    tokens.push({ start, end, text: cleaned })
  }

  return tokens
}
