import { prisma } from '@/lib/prisma';

let seedPromise: Promise<void> | null = null;
let seededDone = false;

interface SeedUserDef {
  key: string;
  name: string;
  email: string;
  city: string;
  country: string;
  countryCode: string;
  locationText: string;
  lat: number;
  lng: number;
}

const SEED_USERS: SeedUserDef[] = [
  { key: 'mina', name: 'Mina Park', email: 'mina.seoul@tastory.demo', city: 'Seoul', country: 'South Korea', countryCode: 'KR', locationText: 'Seoul, KR', lat: 37.57, lng: 126.98 },
  { key: 'kenji', name: 'Kenji Sato', email: 'kenji.tokyo@tastory.demo', city: 'Tokyo', country: 'Japan', countryCode: 'JP', locationText: 'Tokyo, JP', lat: 35.68, lng: 139.65 },
  { key: 'maya', name: 'Maya Lin', email: 'maya.nyc@tastory.demo', city: 'New York', country: 'United States', countryCode: 'US', locationText: 'New York, US', lat: 40.71, lng: -74.01 },
  { key: 'lucas', name: 'Lucas Rossi', email: 'lucas.london@tastory.demo', city: 'London', country: 'United Kingdom', countryCode: 'GB', locationText: 'London, GB', lat: 51.51, lng: -0.13 },
  { key: 'chloe', name: 'Chloé Dubois', email: 'chloe.paris@tastory.demo', city: 'Paris', country: 'France', countryCode: 'FR', locationText: 'Paris, FR', lat: 48.86, lng: 2.35 },
  { key: 'liam', name: 'Liam Davies', email: 'liam.sf@tastory.demo', city: 'San Francisco', country: 'United States', countryCode: 'US', locationText: 'San Francisco, US', lat: 37.77, lng: -122.42 },
  { key: 'soojin', name: 'Soojin Choi', email: 'soojin.busan@tastory.demo', city: 'Busan', country: 'South Korea', countryCode: 'KR', locationText: 'Busan, KR', lat: 35.18, lng: 129.08 },
  { key: 'marcus', name: 'Marcus Vance', email: 'marcus.berlin@tastory.demo', city: 'Berlin', country: 'Germany', countryCode: 'DE', locationText: 'Berlin, DE', lat: 52.52, lng: 13.4 },
  { key: 'elena', name: 'Elena Gomez', email: 'elena.toronto@tastory.demo', city: 'Toronto', country: 'Canada', countryCode: 'CA', locationText: 'Toronto, CA', lat: 43.65, lng: -79.38 },
  { key: 'sora', name: 'Sora Takahashi', email: 'sora.osaka@tastory.demo', city: 'Osaka', country: 'Japan', countryCode: 'JP', locationText: 'Osaka, JP', lat: 34.69, lng: 135.5 },
];

interface CatalogItem {
  title: string;
  subtitle: string;
  category: 'media' | 'music' | 'book' | 'game';
  subCategory?: string;
  file: string;
}

const CATALOG: Record<number, CatalogItem[]> = {
  2021: [
    { title: 'Squid Game', subtitle: 'TV Series · 2021', category: 'media', subCategory: 'drama', file: 'squid-game.jpg' },
    { title: 'Spider-Man: No Way Home', subtitle: 'Movie · 2021', category: 'media', subCategory: 'movie', file: 'spiderman-nwh.jpg' },
    { title: 'Demon Slayer: Mugen Train', subtitle: 'Anime · 2021', category: 'media', subCategory: 'anime', file: 'mugen-train.jpg' },
    { title: 'Dune: Part One', subtitle: 'Movie · 2021', category: 'media', subCategory: 'movie', file: 'dune-1.jpg' },
    { title: 'Project Hail Mary', subtitle: 'Andy Weir · Book', category: 'book', file: 'project-hail-mary.jpg' },
    { title: 'Klara and the Sun', subtitle: 'Kazuo Ishiguro · Book', category: 'book', file: 'klara-sun.jpg' },
  ],
  2022: [
    { title: 'Hype Boy', subtitle: 'NewJeans · Song', category: 'music', subCategory: 'song', file: 'hype-boy.jpg' },
    { title: 'Elden Ring', subtitle: 'Action RPG · 2022', category: 'game', file: 'elden-ring.jpg' },
    { title: 'Chainsaw Man', subtitle: 'Anime · 2022', category: 'media', subCategory: 'anime', file: 'chainsaw-man.jpg' },
    { title: 'Suzume', subtitle: 'Anime · 2022', category: 'media', subCategory: 'anime', file: 'suzume.jpg' },
    { title: 'Everything Everywhere', subtitle: 'Movie · 2022', category: 'media', subCategory: 'movie', file: 'everything-everywhere.jpg' },
  ],
  2023: [
    { title: 'Oshi no Ko', subtitle: 'Anime · 2023', category: 'media', subCategory: 'anime', file: 'oshi-no-ko.jpg' },
    { title: 'I AM', subtitle: 'IVE · Song', category: 'music', subCategory: 'song', file: 'i-am.jpg' },
    { title: 'Physical: 100', subtitle: 'Variety · 2023', category: 'media', subCategory: 'variety', file: 'physical-100.jpg' },
    { title: 'Zelda: Tears of the Kingdom', subtitle: 'Nintendo · 2023', category: 'game', file: 'zelda-totk.jpg' },
    { title: 'Oppenheimer', subtitle: 'Movie · 2023', category: 'media', subCategory: 'movie', file: 'oppenheimer.jpg' },
    { title: 'Frieren: Beyond Journey', subtitle: 'Anime · 2023', category: 'media', subCategory: 'anime', file: 'frieren.jpg' },
  ],
  2024: [
    { title: 'Culinary Class Wars', subtitle: 'Variety · 2024', category: 'media', subCategory: 'variety', file: 'culinary-class.jpg' },
    { title: 'Palworld', subtitle: 'Game · 2024', category: 'game', file: 'palworld.jpg' },
    { title: 'Human Acts', subtitle: 'Han Kang · Book', category: 'book', file: 'human-acts.jpg' },
    { title: 'Dune: Part Two', subtitle: 'Movie · 2024', category: 'media', subCategory: 'movie', file: 'dune-2.jpg' },
    { title: 'Balatro', subtitle: 'Indie Game · 2024', category: 'game', file: 'balatro.jpg' },
    { title: 'GNX', subtitle: 'Kendrick Lamar · Album', category: 'music', subCategory: 'album', file: 'gnx.jpg' },
    { title: 'BRAT', subtitle: 'Charli xcx · Album', category: 'music', subCategory: 'album', file: 'brat.jpg' },
    { title: 'HOME SWEET HOME', subtitle: 'G-DRAGON · Song', category: 'music', subCategory: 'song', file: 'home-sweet-home.jpg' },
  ],
  2025: [
    { title: 'Severance S2', subtitle: 'TV Series · 2025', category: 'media', subCategory: 'drama', file: 'severance.jpg' },
    { title: 'Monster Hunter Wilds', subtitle: 'Action RPG · 2025', category: 'game', file: 'monster-hunter-wilds.jpg' },
    { title: 'Sinners', subtitle: 'Movie · 2025', category: 'media', subCategory: 'movie', file: 'sinners.jpg' },
    { title: 'Pokemon Legends: Z-A', subtitle: 'Game · 2025', category: 'game', file: 'pokemon-za.jpg' },
    { title: 'KPop Demon Hunters', subtitle: 'Movie · 2025', category: 'media', subCategory: 'movie', file: 'kpop-demon-hunters.jpg' },
  ],
};

function getSlotItems(offset: number) {
  const result: {
    year: number;
    slot: number;
    title: string;
    subtitle: string;
    category: string;
    subCategory?: string;
    imageUrl: string;
  }[] = [];

  const years = [2021, 2022, 2023, 2024, 2025];
  for (const yr of years) {
    const list = CATALOG[yr];
    for (let s = 1; s <= 3; s++) {
      const idx = (offset * 2 + (s - 1)) % list.length;
      const it = list[idx];
      result.push({
        year: yr,
        slot: s,
        title: it.title,
        subtitle: it.subtitle,
        category: it.category,
        subCategory: it.subCategory,
        imageUrl: `/seed-images/${it.file}`,
      });
    }
  }
  return result;
}

const POST_THEMES: {
  aspectRatio: string;
  bgColor: string;
  textColor?: string | null;
  fontStyle: string;
}[] = [
  { aspectRatio: '4:5', bgColor: '#0a0a0a', textColor: null, fontStyle: 'sans' },
  { aspectRatio: '4:5', bgColor: '#0f172a', textColor: null, fontStyle: 'mono' },
  { aspectRatio: '1:1', bgColor: '#f4efe6', textColor: '#1c1917', fontStyle: 'serif' },
  { aspectRatio: '4:5', bgColor: '#1c1f24', textColor: null, fontStyle: 'sans' },
  { aspectRatio: '9:16', bgColor: '#0e241b', textColor: null, fontStyle: 'mono' },
  { aspectRatio: '1:1', bgColor: '#261214', textColor: null, fontStyle: 'serif' },
];

const POST_TITLES = [
  'MY 5-YEAR TASTORY',
  'FIVE YEARS OF ESSENTIALS',
  'CULTURE & MEDIA CHRONICLE',
  'DEFINING RELEASES 2021-2025',
  'SOUNDS, FRAMES & WORLDS',
  'THE RETROSPECTIVE TIMELINE',
  'HIGHLIGHTS ACROSS FIVE YEARS',
  'MY PERSONAL TOP PICKS',
  'A FIVE-YEAR MEDIA JOURNEY',
  'FAVORITES THROUGH THE YEARS',
];

const POST_CAPTIONS = [
  'Late nights, cinema trips, and unforgettable game releases.',
  'Looking back at the tracks, series, and books that stayed with me.',
  'From 2021 lockdown binges to 2025 anticipated gems.',
  'A little window into what fueled my creativity over the last 5 years.',
  'Curated from rainy coffee shops and train commutes.',
  'The stories, sounds, and worlds I kept returning to.',
  'Hard to narrow down to 3 per year, but these defined each chapter.',
  'My definitive 2021-2025 culture wall.',
  'Music on repeat, binge-worthy television, and epic game journeys.',
  'Reflecting on five incredible years of entertainment and art.',
];

const USER_ORDER_ROUNDS = [
  // Round 1: Recent posts (1-5 days) - globally diverse cities
  ['chloe', 'kenji', 'maya', 'marcus', 'lucas', 'mina', 'elena', 'liam', 'sora', 'soojin'],
  // Round 2: Earlier posts (5-14 days ago) - interleaved sequence
  ['soojin', 'maya', 'mina', 'liam', 'chloe', 'kenji', 'marcus', 'elena', 'lucas', 'sora'],
  // Round 3: Older posts (15-25 days ago) - balanced distribution
  ['lucas', 'elena', 'sora', 'mina', 'kenji', 'chloe', 'soojin', 'maya', 'marcus', 'liam'],
];

async function runSeed() {
  if (seededDone) return;

  const existingPosts = await prisma.post.count();
  if (existingPosts >= 30) {
    seededDone = true;
    return;
  }

  // Atomic distributed lock using User.email @unique constraint (works across PgBouncer & serverless)
  try {
    await prisma.user.create({
      data: {
        email: 'seed-lock@tastory.internal',
        name: 'System Seed Lock',
        provider: 'system',
      },
    });
  } catch {
    // Another instance is already seeding or has seeded
    seededDone = true;
    return;
  }

  // Clean partial seed if any
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.archiveItem.deleteMany({});
  await prisma.post.deleteMany({});

  await seedAllRecords();
  seededDone = true;
}

async function seedAllRecords() {

  const createdUsers = await Promise.all(
    SEED_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, provider: 'profile' },
        create: {
          email: u.email,
          name: u.name,
          provider: 'profile',
        },
      }),
    ),
  );

  const postsToCreate = [];
  let postIdx = 0;
  const userPostCounts: Record<string, number> = {};

  for (let round = 0; round < USER_ORDER_ROUNDS.length; round++) {
    const roundKeys = USER_ORDER_ROUNDS[round];
    for (let k = 0; k < roundKeys.length; k++) {
      const uKey = roundKeys[k];
      const uDef = SEED_USERS.find((u) => u.key === uKey)!;
      const user = createdUsers.find((u) => u.email === uDef.email)!;
      userPostCounts[uKey] = (userPostCounts[uKey] || 0) + 1;

      const theme = POST_THEMES[postIdx % POST_THEMES.length];
      const title = POST_TITLES[postIdx % POST_TITLES.length];
      const caption = `${POST_CAPTIONS[postIdx % POST_CAPTIONS.length]} (${uDef.city})`;
      const items = getSlotItems(postIdx);

      // Natural social media timeline: dense recently, spreading smoothly across 24 days
      const hoursAgo = Math.round(2 + Math.pow(postIdx, 1.25) * 8.5);
      const createdAt = new Date(Date.now() - hoursAgo * 3600000);

      postsToCreate.push({
        userId: user.id,
        title,
        caption,
        city: uDef.city,
        country: uDef.country,
        countryCode: uDef.countryCode,
        locationText: uDef.locationText,
        latitude: uDef.lat,
        longitude: uDef.lng,
        aspectRatio: theme.aspectRatio,
        bgColor: theme.bgColor,
        textColor: theme.textColor,
        fontStyle: theme.fontStyle,
        showLabels: true,
        remixCount: Math.floor((postIdx * 7) % 5),
        items,
        createdAt,
      });
      postIdx++;
    }
  }

  const createdPosts = await Promise.all(
    postsToCreate.map((p) =>
      prisma.post.create({
        data: {
          userId: p.userId,
          title: p.title,
          caption: p.caption,
          city: p.city,
          country: p.country,
          countryCode: p.countryCode,
          locationText: p.locationText,
          latitude: p.latitude,
          longitude: p.longitude,
          aspectRatio: p.aspectRatio,
          bgColor: p.bgColor,
          textColor: p.textColor,
          fontStyle: p.fontStyle,
          showLabels: p.showLabels,
          remixCount: p.remixCount,
          createdAt: p.createdAt,
          items: {
            create: p.items,
          },
        },
      }),
    ),
  );

  // Deduplicated cross-user likes (3 to 7 likes per post)
  const seenLikes = new Set<string>();
  const likeData: { userId: string; postId: string }[] = [];

  for (let i = 0; i < createdPosts.length; i++) {
    const p = createdPosts[i];
    const likeCountForPost = 3 + (i % 5); // 3..7 likes
    for (let k = 1; k <= likeCountForPost; k++) {
      const liker = createdUsers[(i + k * 2) % createdUsers.length];
      if (liker.id === p.userId) continue;
      const key = `${liker.id}:${p.id}`;
      if (!seenLikes.has(key)) {
        seenLikes.add(key);
        likeData.push({ userId: liker.id, postId: p.id });
      }
    }
  }
  await prisma.like.createMany({ data: likeData });

  // Cross-user comments (2 to 3 comments per post)
  const SAMPLE_COMMENTS = [
    'Love this selection! Culinary Class Wars in 2024 was peak entertainment.',
    'Elden Ring + Hype Boy in 2022 is such a nostalgic combo.',
    'Incredible aesthetic and theme color choices.',
    'Dune Part Two was definitely the highlight of 2024 for me as well!',
    'Frieren and Zelda TOTK made 2023 unforgettable.',
    'Great to see Han Kang\'s Human Acts included here.',
    'Clean timeline! Saving this as inspiration for my own archive.',
    'Spider-Man No Way Home in theaters back in 2021 was an unreal experience.',
    'Balatro and Palworld stole so many hours of my 2024!',
    'Severance S2 and Monster Hunter Wilds in 2025 — immaculate taste.',
  ];

  const commentData: {
    userId: string;
    postId: string;
    content: string;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < createdPosts.length; i++) {
    const p = createdPosts[i];
    const commenter1 = createdUsers[(i + 2) % createdUsers.length];
    const commenter2 = createdUsers[(i + 5) % createdUsers.length];
    const commenter3 = createdUsers[(i + 7) % createdUsers.length];

    if (commenter1.id !== p.userId) {
      commentData.push({
        userId: commenter1.id,
        postId: p.id,
        content: SAMPLE_COMMENTS[i % SAMPLE_COMMENTS.length],
        createdAt: new Date(p.createdAt.getTime() + 1800000),
      });
    }
    if (commenter2.id !== p.userId) {
      commentData.push({
        userId: commenter2.id,
        postId: p.id,
        content: SAMPLE_COMMENTS[(i + 3) % SAMPLE_COMMENTS.length],
        createdAt: new Date(p.createdAt.getTime() + 5400000),
      });
    }
    if (i % 2 === 0 && commenter3.id !== p.userId) {
      commentData.push({
        userId: commenter3.id,
        postId: p.id,
        content: SAMPLE_COMMENTS[(i + 6) % SAMPLE_COMMENTS.length],
        createdAt: new Date(p.createdAt.getTime() + 9000000),
      });
    }
  }
  await prisma.comment.createMany({ data: commentData });
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      console.error('Database seed failed:', err);
    });
  }
  await seedPromise;
}
