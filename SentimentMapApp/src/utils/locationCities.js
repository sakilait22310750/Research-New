/**
 * locationCities.js
 *
 * Maps each tourist location name (lowercase, trimmed) to its city/district
 * in Sri Lanka. Used across the app to replace the generic "Sri Lanka" label
 * with a meaningful city name.
 *
 * Usage:
 *   import { getLocationCity } from '../utils/locationCities';
 *   const city = getLocationCity('Temple of the Sacred Tooth Relic'); // → 'Kandy'
 */

const LOCATION_CITY_MAP = {
  // Cultural / Heritage
  'temple of the sacred tooth relic':    'Kandy',
  'temple of sacred tooth relic':        'Kandy',
  'dalada maligawa':                     'Kandy',
  'jaya sri maha bodhi':                 'Anuradhapura',
  'dambulla cave temple':                'Dambulla',
  'sigiriya':                            'Sigiriya',
  'sigiriya the ancient rock fortress':  'Sigiriya',
  'sigiriya the anctient rock fortness': 'Sigiriya',
  'polonnaruwa':                         'Polonnaruwa',

  // Nature / Parks
  'royal botanical garden':              'Peradeniya',
  'royal botanical gardens':             'Peradeniya',
  'victoria park':                       'Nuwara Eliya',
  'victoria park of nuwara eliya':       'Nuwara Eliya',
  'horton plains':                       'Nuwara Eliya',
  'pinnawala elephant orphanage':        'Kegalle',
  'udawalawe national park':             'Udawalawe',
  'minneriya national park':             'Minneriya',
  'minneriya national ark':              'Minneriya',

  // Waterfalls
  'diyaluma falls':                      'Ella',
  'ravana ella falls':                   'Ella',
  'ravana falls':                        'Ella',

  // Beaches
  'bentota beach':                       'Bentota',
  'hikkaduwa beach':                     'Hikkaduwa',
  'mirissa beach':                       'Mirissa',
  'jungle beach':                        'Unawatuna',
  'negombo beach':                       'Negombo',
  'negambo beach':                       'Negombo',
  'nilaveli beach':                      'Trincomalee',

  // Forts / History
  'galle fort':                          'Galle',
};

/**
 * Returns the city/district name for a given location.
 * Falls back to 'Sri Lanka' if not found in the map.
 *
 * @param {string} locationName - The display name of the location
 * @returns {string} City name, e.g. 'Kandy'
 */
export function getLocationCity(locationName) {
  if (!locationName) return 'Sri Lanka';
  const key = locationName.toLowerCase().trim();

  // Exact match first
  if (LOCATION_CITY_MAP[key]) return LOCATION_CITY_MAP[key];

  // Partial match (for minor name variations)
  for (const [mapKey, city] of Object.entries(LOCATION_CITY_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return city;
  }

  return 'Sri Lanka';
}
