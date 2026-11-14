#!/usr/bin/env node
/**
 * Small mock of the AlphaFit api for the web preview (tools/preview). Shapes follow docs/CONTRACTS.md
 * section 2. Not a test double for the app's logic (the Jest tests do that): it only has to give the
 * screens realistic data.
 *
 *   node tools/preview/mock-api.js [port]        default port 4010
 *   POST /__mode  {"fail": "offline" | "500" | "401" | null}   make every other route fail (or stop failing)
 */
const http = require('http');

const PORT =
  require.main === module && /^[0-9]+$/.test(process.argv[2] || '')
    ? Number(process.argv[2])
    : Number(process.env.MOCK_API_PORT || 4010);
let patchMode = null;
let failMode = null;

const now = Date.now();
const iso = (ms) => new Date(ms).toISOString().slice(0, 19);
const profile = {
  id: 'u1',
  email: 'ann@example.com',
  fullName: 'Ann Example',
  authProvider: 'email',
  subscriptionPlan: 'PREMIUM',
  preferences: { language: 'en', theme: 'dark' },
};
const onboarding = {
  source: 'instagram',
  dateOfBirth: { month: 4, day: 12, year: 1998 },
  gender: 'female',
  height: { value: 170, unit: 'metric', cm: 170 },
  weight: { value: 65, unit: 'metric', kg: 65 },
  fitnessLevel: 'intermediate',
  activityLevel: 'medium',
  workoutsPerWeek: '3-5',
  equipment: 'full-gym',
  goal: 'build-muscle',
};
const diet = {
  dietPreference: 'flexible',
  hasAllergies: false,
  mealsPerDay: 3,
  takesSupplements: false,
};
const projection = { sleepHours: '7-8', dailySteps: '7-10k', stressLevel: 'low' };

const foods = [
  ['Chicken salad', 420, 31, 12, 22],
  ['Oatmeal with berries', 310, 11, 52, 7],
  ['Grilled salmon', 520, 42, 4, 36],
  ['Pasta carbonara', 680, 24, 74, 31],
];
const scans = foods.map(([name, kcal, p, c, f], i) => ({
  id: `scan-${i + 1}`,
  userId: 'u1',
  imageUrl: `http://localhost:${PORT}/images/serve/food-scans/u1/${i + 1}.svg`,
  predictions: [
    {
      foodName: name,
      confidence: 0.9,
      classId: i,
      portionWeightG: 250,
      nutrition: { calories: kcal, proteinG: p, carbsG: c, fatG: f },
    },
  ],
  nutritionSummary: {
    totalCalories: kcal,
    totalProteinG: p,
    totalCarbsG: c,
    totalFatG: f,
    itemCount: 1,
  },
  status: 'COMPLETED',
  createdAt: iso(now - i * 3600_000 * (i === 0 ? 1 : 7)),
  completedAt: iso(now - i * 3600_000 * (i === 0 ? 1 : 7) + 4000),
}));
// Scan 2 carries the optional fields of CONTRACTS 3.6 (portion weight, alternatives, needsConfirmation),
// omitted when absent, so the result screen can be looked at with them.
scans[1].predictions = [
  {
    foodName: 'Oatmeal with berries',
    confidence: 0.86,
    classId: 1,
    portionWeightG: 220,
    nutrition: { calories: 250, proteinG: 8, carbsG: 42, fatG: 5 },
  },
  {
    foodName: 'Mixed berries',
    confidence: 0.41,
    classId: 11,
    portionWeightG: 90,
    nutrition: { calories: 60, proteinG: 3, carbsG: 10, fatG: 2 },
    alternatives: [
      { foodName: 'Blueberries', confidence: 0.38 },
      { foodName: 'Raspberries', confidence: 0.31 },
    ],
  },
];
scans[1].needsConfirmation = true;

/** PATCH /food-scans/{id} as the api implements it: rescale by grams / portionWeightG, resum. */
function patchScan(scan, body) {
  const next = JSON.parse(JSON.stringify(scan));
  for (const edit of body.items || []) {
    const p = next.predictions.find((x) => x.classId === edit.classId);
    if (!p) return { status: 400, body: { status: 400, message: 'unknown classId' } };
    if (!(edit.grams >= 1 && edit.grams <= 5000))
      return { status: 400, body: { status: 400, message: 'grams out of range' } };
    const k = edit.grams / p.portionWeightG;
    for (const key of ['calories', 'proteinG', 'carbsG', 'fatG']) p.nutrition[key] *= k;
    p.portionWeightG = edit.grams;
    if (edit.foodName) p.foodName = edit.foodName;
    next.userEdited = true;
  }
  if (body.confirmed) delete next.needsConfirmation;
  const sum = (key) => next.predictions.reduce((n, p) => n + p.nutrition[key], 0);
  next.nutritionSummary = {
    totalCalories: sum('calories'),
    totalProteinG: sum('proteinG'),
    totalCarbsG: sum('carbsG'),
    totalFatG: sum('fatG'),
    itemCount: next.predictions.length,
  };
  Object.assign(scan, next);
  for (const key of Object.keys(scan)) if (!(key in next)) delete scan[key];
  return { body: ok(scan) };
}

const colors = ['#e9c46a', '#f4a261', '#e76f51', '#2a9d8f'];
const svg = (n) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${colors[n % 4]}"/><circle cx="200" cy="200" r="120" fill="#fff" opacity=".85"/></svg>`;

const ok = (data, message = 'OK') => ({ success: true, message, data, timestamp: iso(now) });

function route(method, path) {
  if (path === '/auth/check-email') return { body: true, bare: true };
  if (path === '/auth/send-verification-code') return { body: '', bare: true };
  if (path === '/auth/verify-code') return { body: true, bare: true };
  if (path === '/auth/firebase')
    return {
      body: {
        token: 'preview-token',
        userId: 'u1',
        user: profile,
        needsOnboarding: false,
        message: 'ok',
      },
      bare: true,
    };
  if (path === '/users/profile') return { body: profile, bare: true };
  if (path === '/onboarding') return { body: ok(onboarding) };
  if (path === '/onboarding/diet') return { body: ok(diet) };
  if (path === '/onboarding/projection') return { body: ok(projection) };
  if (path === '/images/profile') return { body: ok({ imageUrl: null }) };
  if (path === '/food-scans')
    return {
      body: ok({ content: scans, totalElements: scans.length, totalPages: 1, size: 50, number: 0 }),
    };
  if (path.startsWith('/food-scans/')) {
    const scan = scans.find((s) => `/food-scans/${s.id}` === path);
    return scan ? { body: ok(scan) } : { status: 404, body: { status: 404, message: 'Not found' } };
  }
  if (path === '/chatbot/health') return { body: { success: true, data: true }, bare: true };
  if (path === '/chatbot/history') return { body: ok([]) };
  if (path === '/chatbot/chat')
    return {
      body: {
        message: 'Great question! Aim for protein at every meal.',
        role: 'assistant',
        timestamp: now,
        success: true,
      },
      bare: true,
    };
  if (path.startsWith('/barcodes/lookup/'))
    return {
      body: ok({
        scanId: 'b1',
        predictions: [{ food: 'Oat flakes', portionSize: '40 g', portionWeightG: 40 }],
        totalNutrition: { calories: 372, protein: 13, carbs: 60, fat: 7, fiber: 10, sugar: 1 },
        source: 'Open Food Facts',
      }),
    };
  return { status: 404, body: { status: 404, message: 'Not found' } };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  if (url.pathname === '/__mode' && req.method === 'POST') {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      const parsed = JSON.parse(raw || '{}');
      failMode = parsed.fail ?? null;
      patchMode = parsed.patch ?? null;
      res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ fail: failMode, patch: patchMode }));
    });
    return;
  }
  if (url.pathname.startsWith('/images/serve/')) {
    const n = parseInt(url.pathname.match(/(\d+)\.svg$/)?.[1] || '0', 10);
    return res.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end(svg(n));
  }
  // `scans`: only the scan routes fail (the rest of the app loads), to look at History's own error state.
  if (failMode === 'scans' && req.method === 'GET' && url.pathname === '/food-scans')
    return res
      .writeHead(500, { 'Content-Type': 'application/json' })
      .end('{"status":500,"message":"Internal server error"}');
  if (failMode === 'offline') return req.socket.destroy();
  if (failMode === '500')
    return res
      .writeHead(500, { 'Content-Type': 'application/json' })
      .end('{"status":500,"message":"Internal server error"}');
  if (failMode === '401')
    return res
      .writeHead(401, { 'Content-Type': 'application/json' })
      .end('{"status":401,"message":"Unauthorized"}');

  if (req.method === 'PATCH' && url.pathname.startsWith('/food-scans/')) {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      const scan = scans.find((x) => `/food-scans/${x.id}` === url.pathname);
      let result;
      if (patchMode === '404')
        result = { status: 404, body: { status: 404, message: 'Not found' } };
      else if (patchMode === '409')
        result = {
          status: 409,
          body: { status: 409, message: 'The scan changed at the same time' },
        };
      else if (!scan) result = { status: 404, body: { status: 404, message: 'Not found' } };
      else result = patchScan(scan, JSON.parse(raw || '{}'));
      res
        .writeHead(result.status || 200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify(result.body));
    });
    return;
  }

  const result = route(req.method, url.pathname);
  res
    .writeHead(result.status || 200, { 'Content-Type': 'application/json' })
    .end(
      result.bare && typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
    );
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`mock api on http://localhost:${PORT}`));
}
module.exports = { server };
