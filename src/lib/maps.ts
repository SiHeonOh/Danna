// Google Maps deep link for a free-text location. Uses Google's official URL
// scheme (no API key): opens Maps in a tab on desktop, the Maps app on phones.
//
// Bare campus building codes ("BHEE 129", "WALC 1055", "MSEE B012") are weak
// Maps queries on their own — append the campus so they resolve to the
// building. Change LOCATION_SEARCH_SUFFIX if you're not at Purdue.

export const LOCATION_SEARCH_SUFFIX = 'Purdue University'

const BUILDING_CODE = /^[A-Za-z]{2,5}\s?[A-Za-z]?\d{1,4}[A-Za-z]?$/

export function mapsUrl(location: string): string {
  const trimmed = location.trim()
  const query = BUILDING_CODE.test(trimmed) ? `${trimmed} ${LOCATION_SEARCH_SUFFIX}` : trimmed
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function openInMaps(location: string): void {
  window.open(mapsUrl(location), '_blank', 'noopener,noreferrer')
}
