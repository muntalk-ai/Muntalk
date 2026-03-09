#!/usr/bin/env node
// scripts/create-stripe-products.mjs
// 실행: node scripts/create-stripe-products.mjs
// (프로젝트 루트에서 실행 — .env.local 자동 로드 후 Price ID를 파일에 추가)

import { readFileSync, appendFileSync, existsSync } from "fs";
import { resolve } from "path";

// .env.local 수동 파싱
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ .env.local not found. Run this from your project root.");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error("❌ STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const isLive = STRIPE_KEY.startsWith("sk_live");
console.log(`\n🔑 Mode: ${isLive ? "🟢 LIVE (real charges!)" : "🟡 TEST (safe)"}`);

const headers = {
  Authorization: `Bearer ${STRIPE_KEY}`,
  "Content-Type": "application/x-www-form-urlencoded",
};

async function stripePost(path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`[${path}] ${data.error?.message}`);
  return data;
}

async function main() {
  console.log("\n🚀 Creating Lingua AI Premium on Stripe...\n");

  // ── 1. Product ──
  const product = await stripePost("products", {
    name:            "Lingua AI Premium",
    description:     "All 6 levels (A1→C2) · Unlimited AI tutor · SRS · League · 65 languages",
    "metadata[app]": "lingua-ai",
  });
  console.log(`✅ Product: ${product.id}  "${product.name}"`);

  // ── 2. Three Prices ──
  const plans = [
    { label: "Monthly",           amount: 999,  interval: "month", count: 1, key: "MONTHLY"  },
    { label: "Biannual (6 mo.)",  amount: 3999, interval: "month", count: 6, key: "BIANNUAL" },
    { label: "Annual",            amount: 5999, interval: "year",  count: 1, key: "ANNUAL"   },
  ];

  const ids = {};
  for (const p of plans) {
    const price = await stripePost("prices", {
      product:                     product.id,
      currency:                    "usd",
      unit_amount:                 String(p.amount),
      "recurring[interval]":       p.interval,
      "recurring[interval_count]": String(p.count),
      nickname:                    p.label,
    });
    ids[p.key] = price.id;
    const display = `$${(p.amount / 100).toFixed(2)}`;
    console.log(`✅ [${p.label}] ${price.id}  (${display})`);
  }

  // ── 3. Append to .env.local ──
  const block = [
    "",
    "# ── Stripe Price IDs (auto-added by create-stripe-products.mjs) ──",
    `STRIPE_PRICE_MONTHLY=${ids.MONTHLY}`,
    `STRIPE_PRICE_BIANNUAL=${ids.BIANNUAL}`,
    `STRIPE_PRICE_ANNUAL=${ids.ANNUAL}`,
    `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${ids.MONTHLY}`,
    `NEXT_PUBLIC_STRIPE_PRICE_BIANNUAL=${ids.BIANNUAL}`,
    `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${ids.ANNUAL}`,
    "",
  ].join("\n");

  appendFileSync(resolve(process.cwd(), ".env.local"), block);

  console.log("\n✅ .env.local updated! New lines:\n");
  console.log(block.trim());

  console.log(`
─────────────────────────────────────────────
📌 LAST STEP — Stripe Webhook Secret:

  Local test:
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    → copy whsec_... → add to .env.local as STRIPE_WEBHOOK_SECRET

  Production (Vercel):
    Stripe Dashboard → Webhooks → Add endpoint
    URL: https://yourdomain.com/api/stripe/webhook
    Events: checkout.session.completed, invoice.paid,
            invoice.payment_failed, customer.subscription.deleted,
            customer.subscription.updated
─────────────────────────────────────────────

🎉 Done! Run: npm run dev
`);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
