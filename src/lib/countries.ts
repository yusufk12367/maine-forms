// Shared country list + flag-emoji derivation.
// Self-contained: ISO2 code -> flag via regional-indicator unicode (pure fn).
// Used by the hiring dashboard for the nationality graph, filter, and card grid.

export interface Country {
  name: string
  iso2: string
}

// 196 countries (name + ISO2). Mirrors the People app directory-lookups set.
export const COUNTRIES: Country[] = [
  { name: 'Afghanistan', iso2: 'AF' },
  { name: 'Albania', iso2: 'AL' },
  { name: 'Algeria', iso2: 'DZ' },
  { name: 'Andorra', iso2: 'AD' },
  { name: 'Angola', iso2: 'AO' },
  { name: 'Antigua and Barbuda', iso2: 'AG' },
  { name: 'Argentina', iso2: 'AR' },
  { name: 'Armenia', iso2: 'AM' },
  { name: 'Australia', iso2: 'AU' },
  { name: 'Austria', iso2: 'AT' },
  { name: 'Azerbaijan', iso2: 'AZ' },
  { name: 'Bahamas', iso2: 'BS' },
  { name: 'Bahrain', iso2: 'BH' },
  { name: 'Bangladesh', iso2: 'BD' },
  { name: 'Barbados', iso2: 'BB' },
  { name: 'Belarus', iso2: 'BY' },
  { name: 'Belgium', iso2: 'BE' },
  { name: 'Belize', iso2: 'BZ' },
  { name: 'Benin', iso2: 'BJ' },
  { name: 'Bhutan', iso2: 'BT' },
  { name: 'Bolivia', iso2: 'BO' },
  { name: 'Bosnia and Herzegovina', iso2: 'BA' },
  { name: 'Botswana', iso2: 'BW' },
  { name: 'Brazil', iso2: 'BR' },
  { name: 'Brunei', iso2: 'BN' },
  { name: 'Bulgaria', iso2: 'BG' },
  { name: 'Burkina Faso', iso2: 'BF' },
  { name: 'Burundi', iso2: 'BI' },
  { name: 'Cambodia', iso2: 'KH' },
  { name: 'Cameroon', iso2: 'CM' },
  { name: 'Canada', iso2: 'CA' },
  { name: 'Cape Verde', iso2: 'CV' },
  { name: 'Central African Republic', iso2: 'CF' },
  { name: 'Chad', iso2: 'TD' },
  { name: 'Chile', iso2: 'CL' },
  { name: 'China', iso2: 'CN' },
  { name: 'Colombia', iso2: 'CO' },
  { name: 'Comoros', iso2: 'KM' },
  { name: 'Congo', iso2: 'CG' },
  { name: 'Costa Rica', iso2: 'CR' },
  { name: 'Croatia', iso2: 'HR' },
  { name: 'Cuba', iso2: 'CU' },
  { name: 'Cyprus', iso2: 'CY' },
  { name: 'Czech Republic', iso2: 'CZ' },
  { name: 'Democratic Republic of the Congo', iso2: 'CD' },
  { name: 'Denmark', iso2: 'DK' },
  { name: 'Djibouti', iso2: 'DJ' },
  { name: 'Dominica', iso2: 'DM' },
  { name: 'Dominican Republic', iso2: 'DO' },
  { name: 'Ecuador', iso2: 'EC' },
  { name: 'Egypt', iso2: 'EG' },
  { name: 'El Salvador', iso2: 'SV' },
  { name: 'Equatorial Guinea', iso2: 'GQ' },
  { name: 'Eritrea', iso2: 'ER' },
  { name: 'Estonia', iso2: 'EE' },
  { name: 'Eswatini', iso2: 'SZ' },
  { name: 'Ethiopia', iso2: 'ET' },
  { name: 'Fiji', iso2: 'FJ' },
  { name: 'Finland', iso2: 'FI' },
  { name: 'France', iso2: 'FR' },
  { name: 'Gabon', iso2: 'GA' },
  { name: 'Gambia', iso2: 'GM' },
  { name: 'Georgia', iso2: 'GE' },
  { name: 'Germany', iso2: 'DE' },
  { name: 'Ghana', iso2: 'GH' },
  { name: 'Greece', iso2: 'GR' },
  { name: 'Grenada', iso2: 'GD' },
  { name: 'Guatemala', iso2: 'GT' },
  { name: 'Guinea', iso2: 'GN' },
  { name: 'Guinea-Bissau', iso2: 'GW' },
  { name: 'Guyana', iso2: 'GY' },
  { name: 'Haiti', iso2: 'HT' },
  { name: 'Honduras', iso2: 'HN' },
  { name: 'Hungary', iso2: 'HU' },
  { name: 'Iceland', iso2: 'IS' },
  { name: 'India', iso2: 'IN' },
  { name: 'Indonesia', iso2: 'ID' },
  { name: 'Iran', iso2: 'IR' },
  { name: 'Iraq', iso2: 'IQ' },
  { name: 'Ireland', iso2: 'IE' },
  { name: 'Israel', iso2: 'IL' },
  { name: 'Italy', iso2: 'IT' },
  { name: 'Ivory Coast', iso2: 'CI' },
  { name: 'Jamaica', iso2: 'JM' },
  { name: 'Japan', iso2: 'JP' },
  { name: 'Jordan', iso2: 'JO' },
  { name: 'Kazakhstan', iso2: 'KZ' },
  { name: 'Kenya', iso2: 'KE' },
  { name: 'Kiribati', iso2: 'KI' },
  { name: 'Kosovo', iso2: 'XK' },
  { name: 'Kuwait', iso2: 'KW' },
  { name: 'Kyrgyzstan', iso2: 'KG' },
  { name: 'Laos', iso2: 'LA' },
  { name: 'Latvia', iso2: 'LV' },
  { name: 'Lebanon', iso2: 'LB' },
  { name: 'Lesotho', iso2: 'LS' },
  { name: 'Liberia', iso2: 'LR' },
  { name: 'Libya', iso2: 'LY' },
  { name: 'Liechtenstein', iso2: 'LI' },
  { name: 'Lithuania', iso2: 'LT' },
  { name: 'Luxembourg', iso2: 'LU' },
  { name: 'Madagascar', iso2: 'MG' },
  { name: 'Malawi', iso2: 'MW' },
  { name: 'Malaysia', iso2: 'MY' },
  { name: 'Maldives', iso2: 'MV' },
  { name: 'Mali', iso2: 'ML' },
  { name: 'Malta', iso2: 'MT' },
  { name: 'Marshall Islands', iso2: 'MH' },
  { name: 'Mauritania', iso2: 'MR' },
  { name: 'Mauritius', iso2: 'MU' },
  { name: 'Mexico', iso2: 'MX' },
  { name: 'Micronesia', iso2: 'FM' },
  { name: 'Moldova', iso2: 'MD' },
  { name: 'Monaco', iso2: 'MC' },
  { name: 'Mongolia', iso2: 'MN' },
  { name: 'Montenegro', iso2: 'ME' },
  { name: 'Morocco', iso2: 'MA' },
  { name: 'Mozambique', iso2: 'MZ' },
  { name: 'Myanmar', iso2: 'MM' },
  { name: 'Namibia', iso2: 'NA' },
  { name: 'Nauru', iso2: 'NR' },
  { name: 'Nepal', iso2: 'NP' },
  { name: 'Netherlands', iso2: 'NL' },
  { name: 'New Zealand', iso2: 'NZ' },
  { name: 'Nicaragua', iso2: 'NI' },
  { name: 'Niger', iso2: 'NE' },
  { name: 'Nigeria', iso2: 'NG' },
  { name: 'North Korea', iso2: 'KP' },
  { name: 'North Macedonia', iso2: 'MK' },
  { name: 'Norway', iso2: 'NO' },
  { name: 'Oman', iso2: 'OM' },
  { name: 'Pakistan', iso2: 'PK' },
  { name: 'Palau', iso2: 'PW' },
  { name: 'Palestine', iso2: 'PS' },
  { name: 'Panama', iso2: 'PA' },
  { name: 'Papua New Guinea', iso2: 'PG' },
  { name: 'Paraguay', iso2: 'PY' },
  { name: 'Peru', iso2: 'PE' },
  { name: 'Philippines', iso2: 'PH' },
  { name: 'Poland', iso2: 'PL' },
  { name: 'Portugal', iso2: 'PT' },
  { name: 'Qatar', iso2: 'QA' },
  { name: 'Romania', iso2: 'RO' },
  { name: 'Russia', iso2: 'RU' },
  { name: 'Rwanda', iso2: 'RW' },
  { name: 'Saint Kitts and Nevis', iso2: 'KN' },
  { name: 'Saint Lucia', iso2: 'LC' },
  { name: 'Saint Vincent and the Grenadines', iso2: 'VC' },
  { name: 'Samoa', iso2: 'WS' },
  { name: 'San Marino', iso2: 'SM' },
  { name: 'Sao Tome and Principe', iso2: 'ST' },
  { name: 'Saudi Arabia', iso2: 'SA' },
  { name: 'Senegal', iso2: 'SN' },
  { name: 'Serbia', iso2: 'RS' },
  { name: 'Seychelles', iso2: 'SC' },
  { name: 'Sierra Leone', iso2: 'SL' },
  { name: 'Singapore', iso2: 'SG' },
  { name: 'Slovakia', iso2: 'SK' },
  { name: 'Slovenia', iso2: 'SI' },
  { name: 'Solomon Islands', iso2: 'SB' },
  { name: 'Somalia', iso2: 'SO' },
  { name: 'South Africa', iso2: 'ZA' },
  { name: 'South Korea', iso2: 'KR' },
  { name: 'South Sudan', iso2: 'SS' },
  { name: 'Spain', iso2: 'ES' },
  { name: 'Sri Lanka', iso2: 'LK' },
  { name: 'Sudan', iso2: 'SD' },
  { name: 'Suriname', iso2: 'SR' },
  { name: 'Sweden', iso2: 'SE' },
  { name: 'Switzerland', iso2: 'CH' },
  { name: 'Syria', iso2: 'SY' },
  { name: 'Taiwan', iso2: 'TW' },
  { name: 'Tajikistan', iso2: 'TJ' },
  { name: 'Tanzania', iso2: 'TZ' },
  { name: 'Thailand', iso2: 'TH' },
  { name: 'Timor-Leste', iso2: 'TL' },
  { name: 'Togo', iso2: 'TG' },
  { name: 'Tonga', iso2: 'TO' },
  { name: 'Trinidad and Tobago', iso2: 'TT' },
  { name: 'Tunisia', iso2: 'TN' },
  { name: 'Turkey', iso2: 'TR' },
  { name: 'Turkmenistan', iso2: 'TM' },
  { name: 'Tuvalu', iso2: 'TV' },
  { name: 'Uganda', iso2: 'UG' },
  { name: 'Ukraine', iso2: 'UA' },
  { name: 'United Arab Emirates', iso2: 'AE' },
  { name: 'United Kingdom', iso2: 'GB' },
  { name: 'United States', iso2: 'US' },
  { name: 'Uruguay', iso2: 'UY' },
  { name: 'Uzbekistan', iso2: 'UZ' },
  { name: 'Vanuatu', iso2: 'VU' },
  { name: 'Vatican City', iso2: 'VA' },
  { name: 'Venezuela', iso2: 'VE' },
  { name: 'Vietnam', iso2: 'VN' },
  { name: 'Yemen', iso2: 'YE' },
  { name: 'Zambia', iso2: 'ZM' },
  { name: 'Zimbabwe', iso2: 'ZW' },
]

// Demonyms, alternate spellings, and common misspellings seen in free-text
// intake forms. Keys are lowercased. Values are canonical COUNTRIES names.
// This map is what makes "Indian" / "India" / "indian" / "Imdian" all count
// as one bar on the nationality chart.
const ALIASES: Record<string, string> = {
  // United States
  usa: 'United States', 'u.s.a.': 'United States', 'u.s.': 'United States',
  america: 'United States', american: 'United States',
  // United Kingdom
  uk: 'United Kingdom', 'u.k.': 'United Kingdom', britain: 'United Kingdom',
  british: 'United Kingdom', england: 'United Kingdom', englishman: 'United Kingdom',
  // UAE
  uae: 'United Arab Emirates', emirati: 'United Arab Emirates',
  // India
  indian: 'India', imdian: 'India',
  // Nepal
  nepali: 'Nepal', nepalese: 'Nepal', nepales: 'Nepal', nepalees: 'Nepal',
  // Uganda
  ugandan: 'Uganda',
  // Philippines
  filipino: 'Philippines', filipina: 'Philippines', filipinos: 'Philippines',
  pinoy: 'Philippines', filipimo: 'Philippines', philippine: 'Philippines',
  phillipines: 'Philippines', phillippines: 'Philippines', pilipino: 'Philippines',
  // Sri Lanka
  'sri lankan': 'Sri Lanka', srilankan: 'Sri Lanka', srilanka: 'Sri Lanka',
  'sri lanken': 'Sri Lanka', 'buddism sri lanka': 'Sri Lanka',
  'sri lankans': 'Sri Lanka',
  // Myanmar
  burmese: 'Myanmar', burma: 'Myanmar',
  // Pakistan
  pakistani: 'Pakistan',
  // Cameroon
  cameroonian: 'Cameroon',
  // Egypt
  egyptian: 'Egypt',
  // Kenya
  kenyan: 'Kenya',
  // Ghana
  ghanaian: 'Ghana', ghanian: 'Ghana', ghanaese: 'Ghana',
  // Indonesia
  indonesian: 'Indonesia',
  // Turkey
  turkish: 'Turkey', turkiye: 'Turkey',
  // Zimbabwe
  zimbabwean: 'Zimbabwe',
  // Bangladesh
  bangladeshi: 'Bangladesh',
  // Benin
  beninese: 'Benin',
  // Colombia
  colombian: 'Colombia',
  // Lebanon
  lebanese: 'Lebanon', lebenese: 'Lebanon',
  // Mauritius
  mauritian: 'Mauritius',
  // Morocco
  moroccan: 'Morocco',
  // Nigeria
  nigerian: 'Nigeria',
  // Uzbekistan
  uzbek: 'Uzbekistan', uzbekistani: 'Uzbekistan',
  // Other common demonyms (future-proofing)
  russian: 'Russia', 'south korean': 'South Korea', korean: 'South Korea',
  korea: 'South Korea', ivorian: 'Ivory Coast', "cote d'ivoire": 'Ivory Coast',
  czechia: 'Czech Republic', 'congo-brazzaville': 'Congo',
  'congo-kinshasa': 'Democratic Republic of the Congo',
  drc: 'Democratic Republic of the Congo', swaziland: 'Eswatini',
  macedonia: 'North Macedonia', ethiopian: 'Ethiopia', tanzanian: 'Tanzania',
  chinese: 'China', japanese: 'Japan', vietnamese: 'Vietnam',
  thai: 'Thailand', malaysian: 'Malaysia', singaporean: 'Singapore',
  afghan: 'Afghanistan', iranian: 'Iran', iraqi: 'Iraq', syrian: 'Syria',
  jordanian: 'Jordan', 'saudi arabian': 'Saudi Arabia', saudi: 'Saudi Arabia',
  yemeni: 'Yemen', sudanese: 'Sudan', somali: 'Somalia', eritrean: 'Eritrea',
  rwandan: 'Rwanda', bhutanese: 'Bhutan', maldivian: 'Maldives',
}

// name -> ISO2 lookup (lowercased)
const NAME_TO_ISO = new Map<string, string>()
for (const c of COUNTRIES) NAME_TO_ISO.set(c.name.toLowerCase(), c.iso2)

/**
 * Normalize any free-text nationality string to a canonical country name.
 * Handles demonyms (Indian->India), misspellings (Imdian->India),
 * casing/whitespace (SRILANKA->Sri Lanka), and junk (returns 'Unknown').
 * This is the single source of truth for grouping the nationality chart.
 */
export function normalizeNationality(raw: string | null | undefined): string {
  if (!raw) return 'Unknown'
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!key) return 'Unknown'
  // direct country-name match
  if (NAME_TO_ISO.has(key)) {
    return COUNTRIES.find(c => c.iso2 === NAME_TO_ISO.get(key))!.name
  }
  // demonym / misspelling match
  if (ALIASES[key]) return ALIASES[key]
  // reject obvious junk: contains a comma/digit, or isn't mostly letters
  if (/[,;0-9]/.test(key)) return 'Unknown'
  const letters = (key.match(/[a-z]/g) || []).length
  if (letters < 3 || letters < key.replace(/\s/g, '').length * 0.6) return 'Unknown'
  // unknown but plausible — Title-case so it still displays reasonably
  return raw.trim().replace(/\b\w/g, m => m.toUpperCase())
}

/** Resolve a free-text nationality string to a canonical country name, or null. */
export function canonicalCountryName(raw: string | null | undefined): string | null {
  const n = normalizeNationality(raw)
  return n === 'Unknown' ? null : n
}

/** ISO2 -> flag emoji via regional-indicator symbols. */
export function iso2ToFlag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🌐'
  const base = 0x1f1e6
  const chars = iso2.toUpperCase().split('').map(c => base + (c.charCodeAt(0) - 65))
  if (chars.some(cp => cp < base || cp > base + 25)) return '🌐'
  return String.fromCodePoint(...chars)
}

/** Flag emoji for any nationality string. Falls back to a neutral globe. */
export function flagFor(nationality: string | null | undefined): string {
  if (!nationality) return '🌐'
  // normalize first (handles demonyms + misspellings), then map to ISO2
  const canon = normalizeNationality(nationality)
  if (canon !== 'Unknown') {
    const iso = NAME_TO_ISO.get(canon.toLowerCase())
    if (iso) return iso2ToFlag(iso)
  }
  // raw 2-letter code (e.g. "AE")
  const key = nationality.trim().toLowerCase()
  if (key.length === 2) return iso2ToFlag(key)
  return '🌐'
}
