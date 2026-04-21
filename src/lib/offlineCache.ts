const KEYS = {
  items: 'planner_cache_items',
  tags: 'planner_cache_tags',
  rules: 'planner_cache_rules',
  overrides: 'planner_cache_overrides',
} as const

type CacheKey = keyof typeof KEYS

export function readCache<T>(key: CacheKey): T[] {
  try {
    const raw = localStorage.getItem(KEYS[key])
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function writeCache<T>(key: CacheKey, data: T[]): void {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data))
  } catch {
    // Storage quota exceeded — ignore silently
  }
}
