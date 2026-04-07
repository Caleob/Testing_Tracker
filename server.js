const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const CLOUD_RELAY_URL = "https://script.google.com/macros/s/AKfycbzVbkuOnz0hkHl4naN5KuqB-YIWEDQ-OO_x-On8TCf2CPgWn327P54RiqvHCykGMcHyGg/exec";

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT,
            username TEXT,
            password TEXT,
            grade TEXT,
            ela_1 BOOLEAN,
            ela_2 BOOLEAN,
            math_1 BOOLEAN,
            math_2 BOOLEAN,
            sci_1 BOOLEAN,
            sci_2 BOOLEAN,
            parent_phone TEXT,
            is_two_day BOOLEAN,
            is_self_driver BOOLEAN,
            checked_in BOOLEAN DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            test_name TEXT,
            teacher_name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )`);
    }
});

// Periodic Cloud Sync
async function syncWithCloud() {
    try {
        const response = await fetch(CLOUD_RELAY_URL);
        const scans = await response.json();
        
        if (scans && scans.length > 0) {
            console.log(`Found ${scans.length} new scans in cloud. Syncing...`);
            
            for (const scan of scans) {
                if (scan.action === 'CHECK-IN') {
                    db.run(`UPDATE students SET checked_in = 1 WHERE id = ?`, [scan.student_id]);
                    db.run(`INSERT INTO scans (student_id, test_name, teacher_name, timestamp) VALUES (?, ?, ?, ?)`, 
                        [scan.student_id, 'CHECK-IN', scan.teacher_name || 'Unknown', scan.timestamp]);
                } else {
                    db.run(`INSERT INTO scans (student_id, test_name, teacher_name, timestamp) VALUES (?, ?, ?, ?)`, 
                        [scan.student_id, scan.test_name || scan.action, scan.teacher_name || 'Unknown', scan.timestamp]);
                }
            }
            
            // Clear cloud mailbox after successful sync
            await fetch(`${CLOUD_RELAY_URL}?action=clear`);
            console.log("Cloud mailbox cleared.");
        }
    } catch (err) {
        console.error("Cloud sync error:", err.message);
    }
}

// Poll cloud every 5 seconds
setInterval(syncWithCloud, 5000);

// Endpoints for Dashboard
app.post('/api/import', (req, res) => {
    const students = req.body.students;
    db.serialize(() => {
        db.run(`DELETE FROM students`);
        db.run(`DELETE FROM scans`);
        const stmt = db.prepare(`INSERT INTO students (
            id, name, username, password, grade, 
            ela_1, ela_2, math_1, math_2, sci_1, sci_2, 
            parent_phone, is_two_day, is_self_driver, checked_in) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`);
        
        students.forEach(s => {
            stmt.run(
                s.id, s.name, s.username, s.password, s.grade,
                s.ela_1 ? 1 : 0, s.ela_2 ? 1 : 0, s.math_1 ? 1 : 0, 
                s.math_2 ? 1 : 0, s.sci_1 ? 1 : 0, s.sci_2 ? 1 : 0,
                s.parent_phone, s.is_two_day ? 1 : 0, s.is_self_driver ? 1 : 0
            );
        });
        stmt.finalize();
    });
    res.json({ success: true });
});

app.get('/api/dashboard', (req, res) => {
    db.all(`SELECT * FROM students`, [], (err, students) => {
        db.all(`SELECT * FROM scans`, [], (err, scans) => {
             const scansByStudent = {};
             scans.forEach(scan => {
                 if (!scansByStudent[scan.student_id]) scansByStudent[scan.student_id] = [];
                 scansByStudent[scan.student_id].push(scan);
             });
             const fullData = students.map(st => ({
                 ...st,
                 scans: scansByStudent[st.id] || []
             }));
             res.json(fullData);
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
