/**
 * District Places - Key DS Divisions and Villages
 * Used to make district briefs feel real
 */

export const DISTRICT_PLACES: Record<string, string[]> = {
  'Kalutara': [
    'Kalutara North',
    'Dodangoda',
    'Beruwala',
    'Nagoda',
    'Panadura',
    'Horana',
    'Ingiriya'
  ],
  'Colombo': [
    'Fort',
    'Pettah',
    'Borella',
    'Dehiwala',
    'Moratuwa',
    'Colombo 7',
    'Slave Island'
  ],
  'Gampaha': [
    'Negombo',
    'Ja-Ela',
    'Wattala',
    'Kelaniya',
    'Gampaha Town',
    'Minuwangoda',
    'Divulapitiya'
  ],
  'Galle': [
    'Galle Fort',
    'Hikkaduwa',
    'Ambalangoda',
    'Balapitiya',
    'Bentota',
    'Galle Town'
  ],
  'Matara': [
    'Matara Town',
    'Weligama',
    'Mirissa',
    'Dikwella',
    'Hakmana',
    'Akuressa'
  ],
  'Ratnapura': [
    'Ratnapura Town',
    'Elapatha',
    'Kuruwita',
    'Ayagama',
    'Pelmadulla',
    'Balangoda',
    'Embilipitiya'
  ],
  'Kandy': [
    'Kandy City',
    'Peradeniya',
    'Gampola',
    'Nawalapitiya',
    'Katugastota',
    'Akurana'
  ],
  'Nuwara Eliya': [
    'Nuwara Eliya Town',
    'Nanu Oya',
    'Hatton',
    'Talawakelle',
    'Ramboda',
    'Haggala'
  ],
  'Badulla': [
    'Badulla Town',
    'Bandarawela',
    'Haputale',
    'Welimada',
    'Mahiyanganaya',
    'Hali Ela'
  ],
  'Trincomalee': [
    'Trincomalee Town',
    'Kinniya',
    'Nilaveli',
    'Kuchchaveli',
    'Kantale',
    'China Bay'
  ],
  'Batticaloa': [
    'Batticaloa Town',
    'Kalmunai',
    'Eravur',
    'Vakarai',
    'Chenkalady',
    'Kattankudy'
  ],
  'Ampara': [
    'Ampara Town',
    'Akkaraipattu',
    'Kalmunai South',
    'Pottuvil',
    'Uhana',
    'Sammanthurai'
  ],
  'Hambantota': [
    'Hambantota Town',
    'Tangalle',
    'Tissamaharama',
    'Ambalantota',
    'Beliatta',
    'Weeraketiya'
  ],
  'Kegalle': [
    'Kegalle Town',
    'Mawanella',
    'Warakapola',
    'Rambukkana',
    'Galigamuwa',
    'Dehiowita'
  ],
  'Matale': [
    'Matale Town',
    'Dambulla',
    'Sigiriya',
    'Rattota',
    'Ukuwela',
    'Galewela'
  ]
};

export function getDistrictPlaces(districtName: string): string[] {
  return DISTRICT_PLACES[districtName] || [];
}

export function getRandomPlaces(districtName: string, count: number = 3): string[] {
  const places = getDistrictPlaces(districtName);
  if (places.length === 0) return [];
  
  const shuffled = [...places].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, places.length));
}
