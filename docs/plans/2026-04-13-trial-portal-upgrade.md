# Trial Portal Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add e-signatures, payment links, dates-TBC handling, and premium dark design to the ITP trial onboarding portal.

**Architecture:** Extend the existing Next.js 16 trial onboarding app. Add document signing (canvas e-signature, same pattern as itp-women-app). Add payment fields to trial_prospects. Handle missing trial dates gracefully. Redesign all components to match the itp-women-app dark premium aesthetic.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, lucide-react

---

## Phase 1: Database Changes

### Task 1: Add payment + signature columns to trial_prospects

**Context:** The `trial_prospects` table needs payment fields and the `player_documents` table (shared) already has signature columns from the women's app work.

**Step 1: Run migration via Supabase MCP**

```sql
-- Payment fields on trial_prospects
ALTER TABLE trial_prospects ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE trial_prospects ADD COLUMN IF NOT EXISTS payment_amount TEXT;
ALTER TABLE trial_prospects ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
```

**Step 2: Verify columns exist**

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'trial_prospects' 
AND column_name IN ('payment_link', 'payment_amount', 'payment_status');
```

**Step 3: Update `lib/types.ts`**

Add to the `TrialProspect` type:
```typescript
payment_link?: string;
payment_amount?: string;
payment_status?: string;
```

**Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add payment fields to trial_prospects type"
```

---

## Phase 2: E-Signatures

### Task 2: Create document signing components

**Context:** Port the signing components from `~/projects/itp-women-app`. The trial portal needs the same document signing flow: document list, signature modal with canvas, API route to save.

**Files to create (port from itp-women-app, adapt for trial_prospects):**
- `components/DocumentsList.tsx` — list of documents with signed/unsigned status
- `components/SignatureModal.tsx` — full-screen modal with document text, agreement checkbox, name input, canvas signature, parent signature for U18
- `lib/documents.ts` — document content (same 4 documents: liability_waiver, code_of_conduct, media_consent, medical_consent)
- `app/api/sign-document/route.ts` — POST endpoint to upload signature + save record

**Step 1: Copy and adapt from women's app**

Read these files from `~/projects/itp-women-app`:
- `components/DocumentsList.tsx`
- `components/SignatureModal.tsx`
- `lib/documents.ts`
- `app/api/sign-document/route.ts`

Adapt for trial context:
- The API route saves to `player_documents` table with `player_id` = the trial prospect's ID
- The `player_documents` table already exists and has all needed columns (document_type, document_title, signature_image_path, signed_at, signer_name, parent_signer_name, parent_signature_image_path, parent_signed_at, ip_address, user_agent)
- The `signatures` storage bucket already exists with proper RLS

**Step 2: Create documents API route for fetching signed docs**

Create `app/api/documents/route.ts`:
```typescript
// GET /api/documents?player_id=xxx
// Returns signed documents for a player
```

**Step 3: Build & verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/DocumentsList.tsx components/SignatureModal.tsx lib/documents.ts app/api/sign-document/route.ts app/api/documents/route.ts
git commit -m "feat: add document signing components and API"
```

---

### Task 3: Integrate document signing into onboarding flow

**Files to modify:**
- `components/onboarding/OnboardingForm.tsx` — add document signing as step 1 (before existing steps)

**Context:** The current OnboardingForm has steps for travel, equipment, Schengen, documents (upload). Add document SIGNING as a new first step. The existing document upload step stays for passport/Vollmacht uploads.

**Step 1: Read `OnboardingForm.tsx` to understand the current step flow**

Current steps:
1. Travel details (arrival, flight, airport, pickup, WhatsApp)
2. Equipment & Schengen
3. Document uploads (passport, parent passport for U18)
4. Legal documents for U18 (Vollmacht, Wellpass consent)

New steps:
1. **Sign Documents** (NEW — liability waiver, code of conduct, media consent, medical consent)
2. Travel details
3. Equipment & Schengen
4. Document uploads
5. Legal documents for U18

**Step 2: Add DocumentsList to the form as step 1**

Import DocumentsList and render it when on step 1. Add a `refreshDocs` function (same pattern as women's app OnboardingFlow). The "Continue" button should only be enabled when all 4 documents are signed.

**Step 3: Shift existing step numbers**

All existing steps shift by +1. Update step logic, canAdvance checks, handleNext, and step content rendering.

**Step 4: Build & verify**

**Step 5: Commit**

```bash
git commit -m "feat: add document signing as first onboarding step"
```

---

### Task 4: Add document signing to the info page

**Files to modify:**
- `app/[playerId]/page.tsx` — show document signing status on the main info page

**Context:** The info page should show a summary of document signing status (like a checklist) so the player knows what they've signed. Not the full signing flow — just a status view.

Add a section after the travel form showing:
- "Documents: 2/4 signed" with a list
- Link to onboarding if not all signed

**Step 1: Read current page.tsx**

**Step 2: Add document status section**

Fetch from `player_documents` table for this prospect. Show a compact checklist.

**Step 3: Build & verify**

**Step 4: Commit**

---

## Phase 3: Payment

### Task 5: Create payment section component

**Files to create:**
- `components/PaymentSection.tsx` — same as women's app PaymentSection, adapted for trial styling

**Step 1: Port from women's app**

Read `~/projects/itp-women-app/components/PaymentSection.tsx` and adapt. The component shows:
- Payment amount + "Pay via Wise" button (if pending)
- "Partial payment received" warning (if partial)
- "Payment received" confirmation (if received)

For the trial portal, keep the same logic. Styling will be updated in Phase 4 (design).

**Step 2: Add to info page**

In `app/[playerId]/page.tsx`, add the PaymentSection. Show it when `payment_link` is set and `payment_status !== 'received'`.

**Step 3: Add payment fields to Staff App trial prospects**

In `~/projects/ITP-Staff-App`, find the trial prospect detail/edit page and add:
- Payment Amount (text input)
- Wise Payment Link (url input)
- Payment Status (select: pending/partial/received)

Search for where trial_prospects are edited in the Staff App.

**Step 4: Build & verify both apps**

**Step 5: Commit both**

---

## Phase 4: Dates-TBC Handling

### Task 6: Handle missing trial dates gracefully

**Files to modify:**
- `app/[playerId]/page.tsx` — don't show calendar or weather when dates missing
- `components/WelcomeHeader.tsx` — show "Dates to be confirmed" when no dates

**Context:** Currently the info page crashes or shows empty content when `trial_start_date` and `trial_end_date` are not set. It should gracefully show available info and hide date-dependent sections.

**Step 1: Read current WelcomeHeader.tsx**

**Step 2: Update WelcomeHeader**

If no dates: show "Dates to be confirmed" instead of date range.
If only start date: show "Starting {date}".

**Step 3: Update info page**

- WeeklyCalendar: only render when both dates are set (already partially handled)
- WeatherForecast: skip when no dates
- "Good to Know" section: skip when no dates
- Hotel recommendations, locations, contacts: always show

**Step 4: Build & verify**

**Step 5: Commit**

```bash
git commit -m "fix: handle missing trial dates gracefully"
```

---

## Phase 5: Premium Dark Design

### Task 7: Update globals.css + layout.tsx with design system

**Context:** Port the design system from `~/projects/itp-women-app`. Same color tokens, fonts (Outfit + DM Sans), dark-first approach.

**Step 1: Read women's app globals.css and layout.tsx for reference**

```
~/projects/itp-women-app/app/globals.css
~/projects/itp-women-app/app/layout.tsx
```

**Step 2: Update trial app globals.css**

Replace with dark-first theme:
```css
@import "tailwindcss";

@theme inline {
  --color-brand: #ED1C24;
  --color-brand-dark: #C41920;
  --color-brand-glow: rgba(237, 28, 36, 0.15);
  --color-bg: #0A0F1C;
  --color-surface: #141B2D;
  --color-surface-elevated: #1C2438;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-text: #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
}
```

Keep existing `.label`, `.input`, `.btn-primary`, `.btn-secondary` classes but update colors.

**Step 3: Update layout.tsx**

- Replace Inter font with Outfit (display) + DM Sans (body)
- Set permanent dark body background
- Add font variables

**Step 4: Build & verify**

**Step 5: Commit**

---

### Task 8: Redesign WelcomeHeader + TabNav

**Files to modify:**
- `components/WelcomeHeader.tsx` — gradient hero, same pattern as women's app
- `components/TabNav.tsx` — frosted glass bottom nav

**Step 1: Read both current files**

**Step 2: Redesign WelcomeHeader**

Port the gradient hero pattern from women's app WelcomeHeader:
- Gradient from brand red to deep navy
- Subtle texture overlay
- Player name in Outfit font
- Trial dates in frosted pill

**Step 3: Redesign TabNav**

Frosted glass effect, brand-red active indicator. Same pattern as women's app.

**Step 4: Build & verify**

**Step 5: Commit**

---

### Task 9: Redesign info page sections

**Files to modify:**
- `app/[playerId]/page.tsx` — update section styling
- `components/TravelForm.tsx` — dark surface inputs
- `components/WeeklyCalendar.tsx` — dark surface event cards, time format fix
- `components/LocationsList.tsx` + `components/LocationCard.tsx` — dark surface cards
- `components/ContactsList.tsx` — dark surface, larger photos
- `components/WeatherForecast.tsx` — dark surface
- `components/HousingRequest.tsx` — dark surface

**Step 1: Read all component files**

**Step 2: Update each component**

Apply the dark theme design tokens:
- `bg-white` → `bg-[var(--color-surface)]`
- `border-zinc-200` → `border-[var(--color-border)]`
- `text-zinc-900` → `text-[var(--color-text)]`
- `text-zinc-500` → `text-[var(--color-text-secondary)]`
- etc.

Remove all `dark:` prefixes — the app is always dark now.

**IMPORTANT:** Check the WeeklyCalendar time formatting. The women's app had a bug where timestamps like "2026-04-13 07:00:00+00" were displayed as "2026-" instead of "09:00". Apply the same fix:
```typescript
function fmtTime(time?: string): string {
  if (!time) return ''
  if (/^\d{2}:\d{2}/.test(time)) return time.substring(0, 5)
  const d = new Date(time)
  if (isNaN(d.getTime())) return time.substring(0, 5)
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin', hour12: false,
  })
}
```

**Step 3: Build & verify**

**Step 4: Commit**

---

### Task 10: Redesign onboarding form

**Files to modify:**
- `components/onboarding/OnboardingForm.tsx` — dark surface inputs, step indicator, button styling
- `components/onboarding/FileUpload.tsx` — dark surface styling

**Step 1: Read both files**

**Step 2: Apply dark theme**

Same approach: dark surface cards, brand-red focus rings, proper text colors. Step indicator with glow effects.

**Step 3: Build & verify**

**Step 4: Commit**

---

### Task 11: Final deploy + smoke test

**Step 1: Run full build**

```bash
cd ~/projects/itp-trial-onboarding && npm run build
```

**Step 2: Deploy**

```bash
npx vercel --prod --yes
```

**Step 3: Smoke test checklist**

- [ ] Info page loads with dark theme
- [ ] WelcomeHeader shows gradient hero
- [ ] Travel form works with dark inputs
- [ ] Calendar shows events with correct times
- [ ] Locations show in dark cards
- [ ] Contacts show with photos
- [ ] Hotel recommendations visible
- [ ] Payment section visible (if payment_link set)
- [ ] Emergency section visible
- [ ] TabNav shows frosted glass style
- [ ] Onboarding: step 1 shows document signing
- [ ] Onboarding: can sign a document with e-signature
- [ ] Onboarding: U18 shows parent signature
- [ ] Onboarding: remaining steps work (travel, equipment, docs)
- [ ] No dates: shows "Dates to be confirmed" instead of empty calendar
- [ ] Payment hides after status = received

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 — Database | Task 1 | Payment columns on trial_prospects |
| 2 — E-Signatures | Tasks 2-4 | Document signing flow in onboarding + status on info page |
| 3 — Payment | Task 5 | Wise payment link section on info page + Staff App fields |
| 4 — Dates-TBC | Task 6 | Graceful handling of missing trial dates |
| 5 — Design | Tasks 7-10 | Premium dark theme matching women's app |
| 6 — Deploy | Task 11 | Production deploy + smoke test |

**Total: 11 tasks across 6 phases.**

**Reference:** The women's app at `~/projects/itp-women-app` is the source of truth for design tokens, component patterns, and signing flow. Port from there, don't reinvent.
