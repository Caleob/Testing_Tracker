##Goal
I'm trying to streamline state testing for 600-800 students. Currently we use a clipboard and a shared google doc decentralized over 10 testing sites all over Kansas. 
Each student takes 2-6 individual tests (ELA-1, ELA-2, MATH-1,MATH-2, SCI-1, SCI-2)

When a student checks in they are given a small slip of paper with their username and password. Each time they complete a test we write down the time it is completed in pencil and then mark that test completed on a shared spreadsheet. When students are on their last test we text a parent or gaurdian that their student is nearing completiion and will be ready to go soon.
The paper shows they completed each test as the worst case scenario is the student leaving without completing all required tests.

Let's improve and modernize that workflow. I'm thinking something can be done with QR codes. When a student completes a test a teacher scans it and that updates a central source of truth.
On their last test an alert pops up to trigger staff contact with an automatic clipboard copy function for phone numbers and text message content (separately).
Analyze the problem and provide out of the box thinking to manage this huge logistical challenge.

## Problem Analysis

Here's what you're actually managing:

| Challenge | Current Pain | Root Cause |
|---|---|---|
| Proof of completion | Paper slip + pencil | No persistent, scannable identity |
| Central truth | Shared Google Doc (race conditions, lag) | No authoritative write endpoint |
| Last-test detection | Manual counting | No completion state machine |
| Parent alert | Manual texting | No event trigger |

The core insight: **each student needs a scannable identity card that encodes their test roster, and each scan needs to write a timestamped event to a single database.**

---

## Recommended System Design

### The Student Card (replaces the paper slip)

A **laminated or cardstock half-sheet** (think index card size) with:

- Student name + ID printed large
- Username / password printed (same as now)
- **One QR code per required test** — labeled ELA-1, ELA-2, etc., arranged in a row
- Each QR code encodes a unique URL: `http://[your-server]/checkin?student=12345&test=ELA-1`

Staff workflow: student finishes a test → proctor scans *that test's* QR square → done. The card stays with the student as a physical backup. No die-flipping, no ambiguity about which test was just completed.

### The Backend (Node.js, runs on your laptop)

A tiny Express server that:
1. Receives GET requests from QR scans
2. Writes `{ studentId, test, timestamp, site }` to a SQLite file (or Google Sheet via Apps Script)
3. Checks: *is this the student's last required test?* → if yes, flags for parent contact alert
4. Serves a live dashboard page showing all students + completion state across all 10 sites

### The Alert (MVP version for tomorrow)

No Twilio needed yet. When a student hits their last test, the dashboard **turns their row red/orange and plays an audio chime** on the proctor's device. A staff member at each site has the dashboard open on a Chromebook — they see the alert and make the manual text. This is a huge upgrade from counting by hand.

**Post-MVP:** Twilio free tier costs ~$1/month and the Node server can fire the text automatically. Easy upgrade path.

---

## MVP Build Plan for Tomorrow

### Tonight (2–3 hours total)

**Hour 1 — Data prep**
- Export your student roster to a CSV: `studentId, name, site, tests_required, parent_phone`
- `tests_required` is a comma-separated list like `ELA-1,ELA-2,MATH-1`
- This becomes your source of truth

**Hour 1.5 — Node server**
- Express + SQLite (or even just a JSON flat file for tomorrow)
- Three routes: `/checkin` (scan handler), `/dashboard` (live view), `/status/:studentId`
- I can generate this entire server for you — maybe 150 lines of code

**Hour 2.5 — QR card generation**
- Python script reads your CSV and generates a PDF of student cards
- Each card has one QR per required test, auto-laid out
- Print, cut, done — or print on Avery label stock if you want to attach to a lanyard

### At the Test Sites

- Your laptop runs the server on your local network (or hotspot)
- Staff at each site open `http://[your-ip]:3000/dashboard` on their Chromebook
- Proctors scan QR codes with their personal phones — no app needed, it's just a URL
- Dashboard auto-refreshes every 10 seconds

---

## What I Can Build Right Now

Tell me which to start with and I'll generate it immediately:

1. **The Node.js server** — checkin endpoint + live dashboard with alert highlighting
2. **The Python card generator** — reads CSV, outputs a print-ready PDF of student cards with per-test QR codes
3. **Both** — I'll build them in parallel and they'll talk to each other out of the box

Also confirm: do you have a student roster CSV ready to work from, or do you need the scripts to work from a sample/template first?

Revised Architecture
Since sites are all over Kansas on different internet connections, your laptop can't be the kitchen for everyone. You need the kitchen on the internet. Best free option for this use case: Render.com — free tier, deploys directly from GitHub, Node.js support, persistent SQLite file. Five minute setup.
┌─────────────────────────────────────┐
│         RENDER.COM (free)           │
│                                     │
│  Node.js server (Express)           │
│  └── testing.db (SQLite)            │
└──────────────┬──────────────────────┘
               │  Public internet
    ┌──────────┼──────────────┐
    │          │              │
📱 Dodge City  📱 Wichita   💻 Your dashboard
   proctor      proctor      anywhere


QR codes encode https://your-app.onrender.com/checkin?... — works from any phone, anywhere in Kansas, no app install, no login.