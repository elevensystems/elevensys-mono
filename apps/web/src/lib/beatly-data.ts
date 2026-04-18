export interface GenreCategory {
  name: string;
  subgenres: string[];
}

export const GENRES: GenreCategory[] = [
  {
    name: 'Pop',
    subgenres: [
      'Teen Pop',
      'Dance Pop',
      'Electropop',
      'Indie Pop',
      'K-Pop',
      'J-Pop',
      'V-Pop',
      'Synthpop',
      'Art Pop',
    ],
  },
  {
    name: 'Rock',
    subgenres: [
      'Classic Rock',
      'Alternative Rock',
      'Indie Rock',
      'Progressive Rock',
      'Grunge',
      'Post-Rock',
    ],
  },
  {
    name: 'Metal',
    subgenres: [
      'Heavy Metal',
      'Thrash Metal',
      'Death Metal',
      'Black Metal',
      'Progressive Metal',
      'Nu Metal',
    ],
  },
  {
    name: 'Hip Hop',
    subgenres: [
      'Rap',
      'Trap',
      'Boom Bap',
      'Lo-fi Hip Hop',
      'Alternative Hip Hop',
      'Drill',
    ],
  },
  {
    name: 'R&B / Soul',
    subgenres: ['R&B', 'Neo-Soul', 'Soul', 'Funk', 'Contemporary R&B'],
  },
  {
    name: 'Electronic',
    subgenres: [
      'EDM',
      'House',
      'Techno',
      'Trance',
      'Dubstep',
      'Ambient',
      'Synthwave',
      'Drum & Bass',
    ],
  },
  {
    name: 'Jazz',
    subgenres: ['Smooth Jazz', 'Bebop', 'Fusion', 'Latin Jazz', 'Cool Jazz'],
  },
  {
    name: 'Blues',
    subgenres: ['Delta Blues', 'Chicago Blues', 'Electric Blues', 'Blues Rock'],
  },
  {
    name: 'Country',
    subgenres: ['Traditional Country', 'Country Pop', 'Bluegrass', 'Americana'],
  },
  {
    name: 'Folk',
    subgenres: [
      'Indie Folk',
      'Contemporary Folk',
      'Celtic',
      'Singer-Songwriter',
    ],
  },
  { name: 'Reggae', subgenres: ['Roots Reggae', 'Dancehall', 'Dub', 'Ska'] },
  {
    name: 'Latin',
    subgenres: ['Latin Pop', 'Reggaeton', 'Bossa Nova', 'Salsa', 'Bachata'],
  },
  {
    name: 'Classical',
    subgenres: ['Baroque', 'Romantic', 'Contemporary Classical', 'Orchestral'],
  },
  {
    name: 'Soundtrack',
    subgenres: ['Film Score', 'Video Game Music', 'Anime OST'],
  },
  {
    name: 'Lo-fi / Indie',
    subgenres: ['Lo-fi', 'Bedroom Pop', 'Shoegaze', 'Dream Pop'],
  },
];

export const RANDOM_MOODS = [
  'melancholic sunset drive',
  'energetic morning workout',
  'rainy day reading',
  'late night coding session',
  'peaceful meditation',
  'party celebration',
  'heartbreak healing',
  'focused study time',
  'road trip adventure',
  'cozy winter evening',
];
