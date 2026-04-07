# Testing Tracker - Fresh Setup & Deployment Guide

This guide will walk you through setting up the Testing Tracker system on a new laptop (the **Check-In Desk**) and deploying the scanner for your teachers.

---

## 💻 Step 1: Laptop Setup (Desktop Dashboard)

Your laptop acts as the "Brain." It stores the private student names and phone numbers in a local SQLite file and syncs with the teacher scanners via the cloud.

1.  **Get the Code**: Ensure you have the `Testing_Tracker` folder from your GitHub repository onto your new laptop.
2.  **Install Node.js (If missing)**: Download and install the latest LTS version of Node.js from [nodejs.org](https://nodejs.org/).
3.  **Install Dependencies**: Open a terminal in the `Testing_Tracker` folder and run:
    ```powershell
    npm install
    ```
4.  **Start the Server**: Launch the dashboard and the cloud-sync logic by running:
    ```powershell
    npm start
    ```
    *Keep this terminal window open during testing hours.*
5.  **Open the Admin Dashboard**: Visit [http://localhost:3000](http://localhost:3000) in your laptop browser.

---

## 📈 Step 2: Manage the Roster

1.  **Import Data**: On the dashboard (`index.html`), click **"Import CSV"**. Select your student list (like the included `sample_students.csv`).
    *   **Fields required**: `id`, `name`, `username`, `password`, `grade`, `required_tests`, `parent_phone`, `is_two_day`, `is_self_driver`.
2.  **Print Cards**: Click the **"Print Cards"** button. This generates a grid of ID slips. Each slip includes:
    *   A high-density QR code (containing the name, ID, grade, and test plan).
    *   The **Username** and **Password** printed clearly for the student to keep.
3.  **Laminate & Distribute**: Cut these slips out and give them to the students as they check in.

---

## 📱 Step 3: Teacher Scanning (GitHub Pages)

Teachers do **not** need to install anything. They access the scanner via the web.

1.  **Deployment**: Push your code to GitHub and enable **GitHub Pages** (Settings -> Pages -> Branch: `main`).
2.  **Teacher URL**: Send this link to your 4 teachers:
    **`https://[your-username].github.io/Testing_Tracker/public/scanner.html`**
3.  **Workflow**:
    *   Teacher scans the QR code on a student's card.
    *   The phone extracts the name and plan from the QR (meaning it is very stable even if Wi-Fi is slow).
    *   Teacher confirms details and taps **Check In** or a **Test Name**.
    *   The scan logs to your private Google Cloud "Mailbox".

---

## 📋 Step 4: Tracking & Checkout

*   **Real-time Sync**: Your laptop (running `npm start`) checks the Google Cloud relay every 5 seconds. Scans will instantly appear on your dashboard.
*   **Alerts**: When a student has **1 test remaining**, their row on your laptop will highlight. You can click the **[Copy Phone]** and **[Copy Text]** buttons to quickly notify the parent via your preferred messaging app.
*   **Export**: At the end of the day, click **"Export Data"** to download a final report of all completions for your records.

---

### 🛠️ Troubleshooting
*   **"No Tunnel"**: Since we are using the Google Relay method, you can ignore all `localtunnel` or `serveo.net` errors. All you need is `npm start` and the GitHub Pages scanner link.
*   **Missing QR or Credentials**: If the QR code is blank or the text is small, ensure you are using the latest `index.html` from this repository.
