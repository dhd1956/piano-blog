interface VenueLocation {
  province?: string | null
  country?: string | null
}

const CA_PROVINCE_TZ: Record<string, string> = {
  ontario: 'ET',
  quebec: 'ET',
  'nova scotia': 'AT',
  'new brunswick': 'AT',
  'prince edward island': 'AT',
  'newfoundland and labrador': 'NT',
  manitoba: 'CT',
  saskatchewan: 'CT',
  alberta: 'MT',
  'british columbia': 'PT',
  yukon: 'PT',
  'northwest territories': 'MT',
  nunavut: 'ET',
}

const US_STATE_TZ: Record<string, string> = {
  'new york': 'ET',
  florida: 'ET',
  georgia: 'ET',
  ohio: 'ET',
  pennsylvania: 'ET',
  michigan: 'ET',
  'north carolina': 'ET',
  'south carolina': 'ET',
  virginia: 'ET',
  tennessee: 'ET',
  indiana: 'ET',
  kentucky: 'ET',
  'west virginia': 'ET',
  connecticut: 'ET',
  'new jersey': 'ET',
  massachusetts: 'ET',
  maryland: 'ET',
  delaware: 'ET',
  'rhode island': 'ET',
  'new hampshire': 'ET',
  vermont: 'ET',
  maine: 'ET',
  illinois: 'CT',
  texas: 'CT',
  minnesota: 'CT',
  wisconsin: 'CT',
  iowa: 'CT',
  missouri: 'CT',
  arkansas: 'CT',
  louisiana: 'CT',
  mississippi: 'CT',
  alabama: 'CT',
  oklahoma: 'CT',
  kansas: 'CT',
  nebraska: 'CT',
  'north dakota': 'CT',
  'south dakota': 'CT',
  colorado: 'MT',
  utah: 'MT',
  'new mexico': 'MT',
  arizona: 'MT',
  wyoming: 'MT',
  montana: 'MT',
  idaho: 'MT',
  california: 'PT',
  oregon: 'PT',
  washington: 'PT',
  nevada: 'PT',
}

export function tzLabel(venue: VenueLocation | null | undefined): string {
  if (!venue) return ''
  const province = venue.province?.toLowerCase() ?? ''
  const country = venue.country?.toLowerCase() ?? ''
  if (country === 'canada') return CA_PROVINCE_TZ[province] ?? ''
  if (country === 'united states') return US_STATE_TZ[province] ?? ''
  return ''
}
