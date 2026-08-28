export interface PhoneInfo {
  e164: string;
  international: string;
  countryName: string;
  iso: string;
  flag: string;
  known: boolean;
}

// calling code -> [ISO, country name]  (longest code must win at lookup)
const COUNTRIES: Record<string, [string, string]> = {
  '1': ['US', 'United States / Canada'],
  '7': ['RU', 'Russia / Kazakhstan'],
  '20': ['EG', 'Egypt'],
  '27': ['ZA', 'South Africa'],
  '30': ['GR', 'Greece'],
  '31': ['NL', 'Netherlands'],
  '32': ['BE', 'Belgium'],
  '33': ['FR', 'France'],
  '34': ['ES', 'Spain'],
  '36': ['HU', 'Hungary'],
  '39': ['IT', 'Italy'],
  '40': ['RO', 'Romania'],
  '41': ['CH', 'Switzerland'],
  '43': ['AT', 'Austria'],
  '44': ['GB', 'United Kingdom'],
  '45': ['DK', 'Denmark'],
  '46': ['SE', 'Sweden'],
  '47': ['NO', 'Norway'],
  '48': ['PL', 'Poland'],
  '49': ['DE', 'Germany'],
  '51': ['PE', 'Peru'],
  '52': ['MX', 'Mexico'],
  '53': ['CU', 'Cuba'],
  '55': ['BR', 'Brazil'],
  '56': ['CL', 'Chile'],
  '57': ['CO', 'Colombia'],
  '58': ['VE', 'Venezuela'],
  '60': ['MY', 'Malaysia'],
  '61': ['AU', 'Australia'],
  '62': ['ID', 'Indonesia'],
  '63': ['PH', 'Philippines'],
  '64': ['NZ', 'New Zealand'],
  '65': ['SG', 'Singapore'],
  '66': ['TH', 'Thailand'],
  '81': ['JP', 'Japan'],
  '82': ['KR', 'South Korea'],
  '84': ['VN', 'Vietnam'],
  '86': ['CN', 'China'],
  '90': ['TR', 'Türkiye'],
  '91': ['IN', 'India'],
  '92': ['PK', 'Pakistan'],
  '93': ['AF', 'Afghanistan'],
  '94': ['LK', 'Sri Lanka'],
  '95': ['MM', 'Myanmar'],
  '98': ['IR', 'Iran'],
  '211': ['SS', 'South Sudan'],
  '212': ['MA', 'Morocco'],
  '213': ['DZ', 'Algeria'],
  '216': ['TN', 'Tunisia'],
  '218': ['LY', 'Libya'],
  '220': ['GM', 'Gambia'],
  '221': ['SN', 'Senegal'],
  '222': ['MR', 'Mauritania'],
  '223': ['ML', 'Mali'],
  '224': ['GN', 'Guinea'],
  '225': ['CI', "Côte d'Ivoire"],
  '226': ['BF', 'Burkina Faso'],
  '227': ['NE', 'Niger'],
  '228': ['TG', 'Togo'],
  '229': ['BJ', 'Benin'],
  '230': ['MU', 'Mauritius'],
  '231': ['LR', 'Liberia'],
  '232': ['SL', 'Sierra Leone'],
  '233': ['GH', 'Ghana'],
  '234': ['NG', 'Nigeria'],
  '235': ['TD', 'Chad'],
  '236': ['CF', 'Central African Republic'],
  '237': ['CM', 'Cameroon'],
  '238': ['CV', 'Cape Verde'],
  '239': ['ST', 'São Tomé & Príncipe'],
  '240': ['GQ', 'Equatorial Guinea'],
  '241': ['GA', 'Gabon'],
  '242': ['CG', 'Congo'],
  '243': ['CD', 'DR Congo'],
  '244': ['AO', 'Angola'],
  '245': ['GW', 'Guinea-Bissau'],
  '248': ['SC', 'Seychelles'],
  '249': ['SD', 'Sudan'],
  '250': ['RW', 'Rwanda'],
  '251': ['ET', 'Ethiopia'],
  '252': ['SO', 'Somalia'],
  '253': ['DJ', 'Djibouti'],
  '254': ['KE', 'Kenya'],
  '255': ['TZ', 'Tanzania'],
  '256': ['UG', 'Uganda'],
  '257': ['BI', 'Burundi'],
  '258': ['MZ', 'Mozambique'],
  '260': ['ZM', 'Zambia'],
  '261': ['MG', 'Madagascar'],
  '263': ['ZW', 'Zimbabwe'],
  '264': ['NA', 'Namibia'],
  '265': ['MW', 'Malawi'],
  '266': ['LS', 'Lesotho'],
  '267': ['BW', 'Botswana'],
  '268': ['SZ', 'Eswatini'],
  '269': ['KM', 'Comoros'],
  '350': ['GI', 'Gibraltar'],
  '351': ['PT', 'Portugal'],
  '352': ['LU', 'Luxembourg'],
  '353': ['IE', 'Ireland'],
  '355': ['AL', 'Albania'],
  '358': ['FI', 'Finland'],
  '359': ['BG', 'Bulgaria'],
  '370': ['LT', 'Lithuania'],
  '371': ['LV', 'Latvia'],
  '372': ['EE', 'Estonia'],
  '380': ['UA', 'Ukraine'],
  '420': ['CZ', 'Czechia'],
  '421': ['SK', 'Slovakia'],
  '852': ['HK', 'Hong Kong'],
  '855': ['KH', 'Cambodia'],
  '856': ['LA', 'Laos'],
  '880': ['BD', 'Bangladesh'],
  '886': ['TW', 'Taiwan'],
  '960': ['MV', 'Maldives'],
  '961': ['LB', 'Lebanon'],
  '962': ['JO', 'Jordan'],
  '963': ['SY', 'Syria'],
  '964': ['IQ', 'Iraq'],
  '965': ['KW', 'Kuwait'],
  '966': ['SA', 'Saudi Arabia'],
  '968': ['OM', 'Oman'],
  '971': ['AE', 'United Arab Emirates'],
  '972': ['IL', 'Israel'],
  '973': ['BH', 'Bahrain'],
  '974': ['QA', 'Qatar'],
  '975': ['BT', 'Bhutan'],
  '976': ['MN', 'Mongolia'],
  '977': ['NP', 'Nepal'],
  '998': ['UZ', 'Uzbekistan'],
};

function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return '🌐';
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  );
}

function groupDigits(n: string): string {
  const parts: string[] = [];
  for (let i = 0; i < n.length; i += 3) parts.push(n.slice(i, i + 3));
  return parts.join(' ');
}

export function formatPhone(raw: string): PhoneInfo {
  const digits = (raw || '').replace(/\D/g, '');

  if (!digits) {
    return {
      e164: '',
      international: '',
      countryName: 'Unknown',
      iso: '',
      flag: '🌐',
      known: false,
    };
  }

  let code = '';
  let iso = '';
  let name = 'Unknown';
  for (let len = 3; len >= 1; len--) {
    const candidate = digits.slice(0, len);
    if (COUNTRIES[candidate]) {
      code = candidate;
      iso = COUNTRIES[candidate][0];
      name = COUNTRIES[candidate][1];
      break;
    }
  }

  const national = digits.slice(code.length);
  const known = !!code && national.length >= 7 && national.length <= 12;

  return {
    e164: `+${digits}`,
    international: code ? `+${code} ${groupDigits(national)}` : `+${groupDigits(digits)}`,
    countryName: name,
    iso,
    flag: known ? isoToFlag(iso) : '🌐',
    known,
  };
}
