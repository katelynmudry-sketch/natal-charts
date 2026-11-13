# Natal chart pages: handoff for Claude Code

## 1. Quick project summary

Build a small web app on Vercel that makes personal natal chart pages.

- **First use:** an astrology class of about 20 people, co-taught by Katelyn Mudry (Solarium / Zorya Commons) and a co-host. Each student gets a printed PDF chart in class and a private online chart page at a unique link, reachable by a QR code on their PDF.
- **Long-term use:** the main version is branded Solarium. Class or event versions are co-branded with a partner (both logos, both booking links).
- **The owner is a non-coder.** Explain each step in plain language, give full files (no snippets), and make setup instructions click-by-click.

### Privacy rule (non-negotiable)
Real birth data must never be sent to Claude or any AI tool. Build and test with made-up rows only. Katelyn uploads her real Excel file herself, on her own admin page, in her own browser.

---

## 2. User flow

### Admin (Katelyn)
1. Opens `/admin` (password protected).
2. Drags in an Excel file (.xlsx). The browser reads it locally.
3. The app keeps only rows where `Paid Y/N` = Y.
4. For each row, the browser:
   - looks up the birthplace (latitude, longitude, IANA time zone)
   - converts local birth time to UTC using the **historical** time zone rules for that date
   - calculates the chart
5. **Review screen:** a table with name, matched place (city, region, country), Sun, Moon, Rising, day/night. Each row can be edited: fix the place match, override lat/long, change time. There's also an optional **Herbal ally** field (text plus optional link) that Katelyn fills in by hand.
6. **Save charts:** each chart gets a random slug and is uploaded to Vercel Blob through a password-checked API route.
7. **Download links file:** a CSV with `Name, Contact, Link` that downloads to her computer only. Contact is never uploaded.
8. **Print all:** opens one print view with every chart, 1 per page, each with a QR code to its link. She prints to paper or saves as PDF from the browser's print dialog.

### Student
1. Scans the QR code or opens the link: `/c/{slug}`
2. Sees their chart in the house-and-planet layout, with brief explanations beside it.
3. Writes in a Notes area that saves on their own device, with a **Download my notes** button.
4. Sees booking links for both hosts.
5. Can print their own page.

---

## 3. Excel input

Columns, exactly as in Katelyn's sheet:

| Column | Use |
|---|---|
| `Name` | Full name. Stored and shown on the chart. |
| `Contact` | **Never uploaded.** Used only in the local links CSV. |
| `DOB` | Birth date. Accept real Excel date cells and `YYYY-MM-DD` text. If the text is ambiguous (like `03/04/1990`), flag the row on the review screen and make her confirm it. |
| `Time` | Accept `2:15 PM`, `14:15`, Excel time cells, and `unknown` (case-insensitive, also blank). |
| `Location` | Free text, ideally `City, Province/State, Country`. |
| `Paid Y/N` | Only process `Y` / `y` / `yes`. |

Ignore any extra columns. Show clear row-level errors. One bad row shouldn't stop the batch.

---

## 4. What gets stored online

Each chart is stored as one JSON file in Vercel Blob at `charts/{slug}.json`. It contains:

- `slug`, `fullName`, `event` (event config id), `createdAt`
- `timeKnown` (boolean)
- calculated positions: each planet's sign, degree, whole sign house, retrograde flag
- Rising sign and degree (if time is known)
- sect, chart ruler, morning/evening star results, birth moon phase
- `herbalAlly` (optional text and link)

**Not stored:** the raw birth date, time or birthplace, and contact info.

The slug is random and unguessable: at least 10 characters, using nanoid with a URL-safe alphabet. Add `<meta name="robots" content="noindex">` on chart pages so they stay out of search engines.

---

## 5. Chart features (version 1)

**Zodiac and houses:** tropical zodiac, **whole sign houses** (the Rising sign is the entire 1st house, the next sign is the 2nd, and so on).

**Planets:** Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn. Include Uranus, Neptune and Pluto in a visually secondary "modern planets" group (open question 1 below). Show the Ascendant. The Midheaven is optional, display only.

### 5.1 Day or night chart (sect)
- Day chart: the Sun is above the horizon at birth. Night chart: the Sun is below.
- Calculate the Sun's altitude for the birth time and place.
- If the Sun is within 1° of the horizon, add a small note ("born right around sunrise/sunset").
- Day team: Sun, Jupiter, Saturn. Night team: Moon, Venus, Mars. Mercury goes with the day team as a morning star and the night team as an evening star.
- Display:
  - Day chart: ally planet = Jupiter, teacher planet = Mars
  - Night chart: ally planet = Venus, teacher planet = Saturn
- If the birth time is unknown, show "Day or night chart needs a birth time."

### 5.2 Chart ruler
Traditional rulers of the Rising sign:
Aries Mars, Taurus Venus, Gemini Mercury, Cancer Moon, Leo Sun, Virgo Mercury, Libra Venus, Scorpio Mars, Sagittarius Jupiter, Capricorn Saturn, Aquarius Saturn, Pisces Jupiter.

Show the ruling planet, its sign and its whole sign house. Hide this card if the time is unknown.

### 5.3 Morning or evening star (Mercury and Venus)
- Morning star: the planet rises before the Sun (its ecliptic longitude is behind the Sun's, so it sits west of the Sun).
- Evening star: the planet sets after the Sun (its longitude is ahead of the Sun's).
- Calculate with the signed elongation: `normalize(planetLon - sunLon)` into -180..180. Negative = morning star, positive = evening star.
- Add "under the Sun's beams" when the planet is within 15° of the Sun. The Sun hides it from view at that distance.
- Structure the code so Skyscope logic (heliacal rising, cazimi, combust) can plug in later.

### 5.4 Birth moon phase
Phase angle = `normalize(moonLon - sunLon)` into 0..360. Use the 8 phases from Dane Rudhyar's lunation cycle:

| Angle | Phase |
|---|---|
| 0–45 | New |
| 45–90 | Crescent |
| 90–135 | First quarter |
| 135–180 | Gibbous |
| 180–225 | Full |
| 225–270 | Disseminating |
| 270–315 | Last quarter |
| 315–360 | Balsamic |

Show the phase name, a simple moon icon, and a 1–2 line blurb from the content file.

### 5.5 Herbal ally
Hand-entered by Katelyn on the review screen: text plus an optional link. Leave it blank and the card hides.

### 5.6 Unknown birth time
Calculate for 12:00 local time. Show planet signs only, with no Rising, houses, sect or chart ruler. If the Moon may have changed sign during that day, show both possible signs. Add a friendly note: "Know your birth time later? Ask us to update your chart."

---

## 6. Explanations (sidebar)

Explanations are brief planet, sign, house and feature blurbs stored in content files, kept separate from the code:

```
content/
  planets.json      # 1–2 lines each + source
  signs.json
  houses.json
  sect.json
  moon-phases.json
  prompts.json      # 1 reflection prompt per planet (for the notes area)
```

Each entry looks like: `{ "id": "venus", "title": "Venus", "text": "...", "source": "Valens, Anthologies Book I" }`

- **Don't invent interpretations.** Fill the files with clearly marked placeholders (`"text": "TODO: Katelyn to write"`). Katelyn writes and sources the copy from her references (Valens, George and Brennan, Rudhyar).
- Show the `source` as a small tag under each blurb.
- Copy style rules for anything visible: short paragraphs, contractions, active voice, no em dashes, no "not X but Y" constructions, sentence case headings, numbers as digits, warm and encouraging wording (describe the harder placements gently).

---

## 7. Notes (stored on the student's device)

- One Notes area on the chart page. Optionally, each planet's reflection prompt can have an "Add to my notes" button that inserts the prompt text.
- Save to `localStorage` under the key `notes:{slug}`, auto-saving as they type. Wrap every read and write in try/catch, and show "Notes couldn't save on this device" if storage fails.
- **Download my notes** button: saves a `.txt` file named `{first-name}-chart-notes.txt`.
- Show a short note under the box: "Your notes stay on this device only. Download them to keep a copy." Safari can clear site storage after a period of non-use, so the download button matters.
- Nothing about notes goes to the server in version 1. (Future Solarium version: Supabase with an email login.)

---

## 8. Branding and events

Event and brand settings live in config files, so a new class doesn't need new code:

```
config/events/
  solarium.json          # default brand
  class-2026-fall.json   # co-branded class (name to confirm)
```

Example:
```json
{
  "id": "class-2026-fall",
  "title": "Intro to your natal chart",
  "brands": [
    { "name": "Solarium", "logo": "/logos/solarium.svg" },
    { "name": "CO-HOST BRAND", "logo": "/logos/cohost.svg" }
  ],
  "hosts": [
    { "name": "Dr. Katelyn Mudry", "bookingUrl": "TODO", "blurb": "TODO" },
    { "name": "CO-HOST NAME", "bookingUrl": "TODO", "blurb": "TODO" }
  ],
  "colors": { "primary": "TODO", "accent": "TODO", "background": "TODO" }
}
```

The admin page has an event dropdown. The chosen event id is saved into each chart.

**Layout:** Katelyn will supply her existing houses-and-planets HTML page. Use it as the visual base for the chart page and keep its look. Add the feature cards, sidebar explanations, notes and booking section around it.

---

## 9. Print and PDF

- Use a print stylesheet (`@media print`) on the chart page: letter size, fits on 1 page if possible (2 maximum), logos at the top, a QR code and short link at the bottom, and no notes box or buttons.
- `/admin/print` renders every chart from the current batch with `page-break-after: always`, so she can print once to get all 20.
- QR code: the `qrcode` npm package, encoding the full URL `https://{domain}/c/{slug}`.

---

## 10. Recommended stack and architecture decisions

| Choice | Why |
|---|---|
| **Next.js (App Router) on Vercel** | Katelyn already uses Vercel. Pages and small API routes live in one project. |
| **astronomy-engine** (npm, MIT license) | Accurate planet positions in the browser, free for commercial use. Swiss Ephemeris is very accurate but AGPL or paid-license, so avoid it unless Katelyn chooses otherwise. |
| **Ascendant calculated by hand** | Use local sidereal time from astronomy-engine plus the standard ascendant formula, with a quadrant correction and the obliquity of the ecliptic. Write unit tests. |
| **Luxon** | Converts local birth time to UTC using IANA historical rules, including old daylight saving changes. |
| **Geocoding: Open-Meteo Geocoding API** (free, no key, returns lat/long and time zone) | Called from the browser with the place text only. Show the top match plus alternatives in a dropdown on the review screen. Allow a manual lat/long and time zone override. Throttle requests. |
| **SheetJS** for Excel | Install from the official SheetJS CDN tarball per their docs, since the npm registry version is outdated. |
| **Vercel Blob** for chart JSON | No database needed for v1. Charts are written once and rarely change. |
| **nanoid** for slugs | Random, unguessable links. |
| **qrcode** for QR codes | Simple and reliable. |

### Security
- `ADMIN_PASSWORD` env var. `/admin` asks for it and `POST /api/charts` checks it server-side. Use a signed httpOnly cookie after login.
- `BLOB_READ_WRITE_TOKEN` stays server-side only.
- Charts are read through `GET /c/{slug}` (server fetches from Blob) so the Blob URL structure isn't exposed.
- `POST /api/charts` rejects any payload that contains birth date, time, place or contact fields. This is a guard against future mistakes.

### Folder sketch
```
app/
  admin/page.tsx          # login, upload, review, save
  admin/print/page.tsx    # print-all view
  c/[slug]/page.tsx       # student chart page
  api/charts/route.ts     # save (POST)
  api/login/route.ts
lib/
  astro/positions.ts      # planets, retrograde
  astro/ascendant.ts
  astro/houses.ts         # whole sign
  astro/sect.ts
  astro/chartRuler.ts
  astro/visibility.ts     # morning/evening star, under beams
  astro/moonPhase.ts
  excel/parse.ts
  geo/geocode.ts
  time/toUtc.ts
components/
  ChartLayout.tsx         # based on Katelyn's HTML
  FeatureCards.tsx
  Sidebar.tsx
  Notes.tsx
  Booking.tsx
  PrintFooter.tsx
content/   config/   public/logos/
tests/
```

---

## 11. Build phases (do them in order, and check in after each)

1. **Calculation core plus tests.** Positions, Ascendant, whole sign houses, sect, chart ruler, morning/evening star, moon phase. Test against 3 made-up birth records that Katelyn checks herself on astro.com (whole sign setting). Tolerance: 1 arcminute for planets, 0.1° for the Ascendant.
2. **Chart page** using Katelyn's HTML layout, fed by a sample JSON file.
3. **Admin flow:** password, Excel upload, geocoding, review screen, herbal ally field.
4. **Blob saving, links CSV and the `/c/{slug}` route.**
5. **Print view and QR codes.**
6. **Notes and booking section.**
7. **Deploy, then a full dry run** with a fake 3-row Excel file.

---

## 12. Setup instructions (for Katelyn)

1. In VS Code, open an empty folder called `natal-charts` and start Claude Code there. Paste this whole file in as the first message.
2. When Claude Code asks, install **Node.js** (LTS version) if you don't have it.
3. Create a **GitHub repository** called `natal-charts` (private) and let Claude Code push to it.
4. On **vercel.com**, click Add New, then Project, and import `natal-charts`.
5. In the Vercel project, go to Storage, create a **Blob** store and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
6. In Settings, then Environment Variables, add `ADMIN_PASSWORD` with a strong password.
7. In Settings, then Domains, add your subdomain (for example `charts.zoryacommons.com`) and follow Vercel's DNS steps.
8. Drop your logos into `public/logos/` and fill in booking links in the event config file.
9. Test with the fake 3-row Excel file before using the real one.

## 13. Dependencies
`next`, `react`, `react-dom`, `astronomy-engine`, `luxon`, `xlsx` (SheetJS, from the CDN tarball), `@vercel/blob`, `nanoid`, `qrcode`, plus dev: `typescript`, `vitest`.

---

## 14. Open items before or during the build

1. Include Uranus, Neptune and Pluto? (Default: yes, as a secondary group.)
2. Katelyn's existing chart HTML file.
3. Both logos (SVG or high-res PNG), co-host name, both booking URLs, short host blurbs.
4. Domain or subdomain to use.
5. Class date (set the print deadline 3 days before it).
6. Event title for the co-branded config.
7. Signup form line for students: "Your chart will be saved at a private link only you receive. We store your name and chart placements, and your notes stay on your own device."

## 15. Next steps after version 1
- Solarium public version: a self-serve birth data form, Supabase accounts, notes synced across devices.
- "This season for you": the current Sun's house in their chart.
- Skyscope tie-ins: heliacal rising, cazimi.
- Herbal ally library pulled from Borage and Balm research.
