import type { User } from './types'

const MENTION_REGEX = /@([a-zA-Z0-9_](?:[a-zA-Z0-9_.]{0,30}[a-zA-Z0-9_])?)/g

export function parseMentionUsernames(content: string): string[] {
  const out = new Set<string>()
  let m: RegExpExecArray | null
  MENTION_REGEX.lastIndex = 0
  while ((m = MENTION_REGEX.exec(content)) !== null) {
    if (m[1]) out.add(m[1])
  }
  return Array.from(out)
}

export function resolveMentions(content: string, users: User[]): User[] {
  const usernames = parseMentionUsernames(content).map(u => u.toLowerCase())
  if (usernames.length === 0) return []
  const seen = new Set<string>()
  const out: User[] = []
  for (const u of users) {
    if (usernames.includes(u.username.toLowerCase()) && !seen.has(u.id)) {
      seen.add(u.id)
      out.push(u)
    }
  }
  return out
}

export interface MentionToken {
  type: 'text' | 'mention'
  value: string
  username?: string
}

export function tokenizeContent(content: string, knownUsernames: Set<string>): MentionToken[] {
  const tokens: MentionToken[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  const re = new RegExp(MENTION_REGEX.source, 'g')
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: content.slice(lastIndex, m.index) })
    }
    const username = m[1]
    const isKnown = knownUsernames.has(username.toLowerCase())
    tokens.push({ type: isKnown ? 'mention' : 'text', value: `@${username}`, username })
    lastIndex = re.lastIndex
  }
  if (lastIndex < content.length) {
    tokens.push({ type: 'text', value: content.slice(lastIndex) })
  }
  return tokens
}
