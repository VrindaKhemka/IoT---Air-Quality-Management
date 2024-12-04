const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fs = require("fs");

// Load Firebase private key JSON
const serviceAccount = JSON.parse(fs.readFileSync("firebase-key.json", "utf8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://air-quality-management-vrinda-default-rtdb.asia-southeast1.firebasedatabase.app/" // Replace with your database URL
});

const app = express();
app.use(cors());
const db = admin.database();

// API to fetch latest air quality data
app.get("/air-quality", (req, res) => {
    const ref = db.ref("air-quality");

    ref.once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) return res.json({ message: "No data found" });

        // Get the most recent entry
        const keys = Object.keys(data);
        const latestKey = keys[keys.length - 1];
        const latestData = data[latestKey];

        const [airQuality, co, temp, hum] = latestData.air_quality
            .split(" ")
            .map((item) => parseFloat(item.split(":")[1]) || "N/A");

        // Check for alerts
        const alerts = [];
        if (co > 350) {
            alerts.push("⚠️ High CO levels detected!");
        } else if (co <= 350) {
            // Low-level alert for CO
            alerts.push("✅ CO levels are safe.");
        }
        
        if (airQuality > 500) {
            alerts.push("⚠️ Air quality is hazardous!");
        } else if (airQuality <= 500) {
            // Low-level alert for air quality
            alerts.push("✅ Air quality is good.");
        }
        
        res.json({
            timestamp: latestData.timestamp,
            temperature: temp,
            humidity: hum,
            co,
            airQuality,
            alerts,
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
