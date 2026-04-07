# Testing Tracker - Architecture & System Design

This repository contains a robust, hybrid cloud/local system designed to orchestrate state testing logistics across multiple teacher proctors while preserving strict student data privacy and entirely bypassing school firewall port-forwarding restrictions.

## 🏗️ The Tech Stack

1.  **Backend (The "Brain"):** Node.js and Express
2.  **Database:** Local SQLite (`database.sqlite`)
3.  **Cloud Relay:** Google Apps Script (Web App)
4.  **Frontend (Scanner):** Vanilla HTML/JS with `html5-qrcode` hosted on GitHub Pages
5.  **Frontend (Dashboard):** Native Web UI hosted on `localhost:3000`

---

## ⚙️ How It Works (The Data Pipeline)

Because school networks routinely block inbound connections (prohibiting systems like `localtunnel` or standard port forwarding), this system leverages a **Stateless Polling Architecture** via a Google Cloud "Mailbox".

### 1. Data Import & Generation
The user imports a CSV (`sample_students.csv`) into the Local Dashboard running on the Check-in Desk laptop. The laptop creates local SQLite records. It then generates printable **High-Density QR Cards**. The QR code doesn't just contain an ID; it contains the student's *entire record* compressed into a boolean byte-string (e.g., `STU001|John Doe|11|555-0101|1,1,0,0,1,0|...`). 

### 2. The Stateless Scanner (GitHub Pages)
Teachers walk the room and load the Scanner App from a public GitHub Pages URL. Because the QR code contains the full student record, the scanner does **not** need to request roster information from the master laptop. It decrypts the QR byte-string locally, instantly determining what tests the student needs to take, rendering the UI dynamically. 

### 3. The Fire-and-Forget Ping
When a teacher taps "Complete: Math-1", the phone fires an asynchronous, fire-and-forget HTTP `POST` to a **Google Apps Script Web App**. The phone interface instantly resets and shows a "Success" message without waiting to hear back. 
The Google script acts solely as a secure queue/mailbox, adding `{"student_id": "STU1", "action": "TEST_COMPLETE", "teacher": "Mr. Smith"}` to its list.

### 4. The Dashboard Sync
Every 5 seconds, the `server.js` Node instance on the laptop explicitly `fetch()`es the Google Apps Script mailbox. 
*   If new scans are found, it pulls them down.
*   It immediately tells Google to "clear" the mailbox.
*   It writes the scans to the local `database.sqlite` and calculates progress.
*   The Dashboard UI refreshes, performing duplicate scan detection and flagging any anomalies (e.g. two teachers accidentally logging the same math test).

---

## 📁 Repository Structure

### `server.js`
The core Node.js server. 
*   Initializes the SQLite schema (`students` and `scans` tables).
*   Hosts the local `/api/import` and `/api/dashboard` REST endpoints for the Dashboard UI.
*   Runs the 5-second `setInterval` loop to poll and clear the Google Cloud Relay.
*   **Security Note:** Keeps all Personal Identifiable Information (PII) localized purely to the desk laptop; name and phone fields are never sent to the cloud.

### `public/index.html` (Admin Dashboard)
The master terminal for the front desk.
*   **Regex CSV Parser:** Safely imports the student roster templates.
*   **Print Engine:** Contains an aggressive `@media print` CSS block that hides the dashboard UI and cleanly formats the high-density QR cards into a tight, ink-saving grid.
*   **Audit Logic:** Calculates total requirements versus completed scans. Highlights cells in Orange (1-Test left warning) and Green (Done), while painting duplicated scans in Red. Clicking tests opens the Audit Modal showing exact Teacher Timestamp logs.

### `public/scanner.html` (Teacher Phone App)
The mobile worker node.
*   **Teacher Authentication:** Prompts the teacher for their name on first-load and saves it to local-storage to append to all future network payloads.
*   **Stateless Processing:** Relies purely on extracting properties from the QR block.
*   **Network Payload:** Utilizes `fetch` under standard CORS configurations to dump JSON payloads into Google execution endpoints seamlessly.

### `public/utils.js` (Audio Service)
A lightweight Web Audio API wrapper that synthesizes explicit "Ta-Da!" chords when tests are logged, or upbeat arpeggios when students are checked in/out. This gives teachers critical auditory confirmation without looking at the screen.

### `sample_students.csv`
The strict templated CSV roster requiring 14 explicit columns (ID, Name, Username, Password, Grade, 6 boolean Test Columns, Phone, 2-Day Boolean, Self-Driver Boolean).

### `walkthrough.md`
A plain-English operational guide tracking how to boot up the system natively. 

### `.gitignore`
Ensures that the `database.sqlite`, `node_modules`, and potentially sensitive logs are strictly excluded from GitHub commits, preventing accidental exposure of sensitive student credentials on the public scanner repository.