import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

// Heuristics (H1-H10)
const HEURISTICS = [
    { id: "H1", name: "Visibility of System Status" },
    { id: "H2", name: "Match Between System and Real World" },
    { id: "H3", name: "User Control and Freedom" },
    { id: "H4", name: "Consistency and Standards" },
    { id: "H5", name: "Error Prevention" },
    { id: "H6", name: "Recognition Rather Than Recall" },
    { id: "H7", name: "Flexibility and Efficiency of Use" },
    { id: "H8", name: "Aesthetic and Minimalist Design" },
    { id: "H9", name: "Help Users Recognize, Diagnose, and Recover from Errors" },
    { id: "H10", name: "Help and Documentation" }
];

const PLACEHOLDER_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    generationConfig: { responseMimeType: "application/json" }
}); 

async function runAudit(participantId, heuristic) {
    const startTime = Date.now();
    try {
        const prompt = `UX Audit: ${heuristic.id} - ${heuristic.name}. Return JSON { "overall_score": number }`;
        const imagePart = { inlineData: { data: PLACEHOLDER_IMAGE_BASE64, mimeType: "image/png" } };
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        await response.text(); // Consume response
        
        const duration = Date.now() - startTime;
        return { success: true, duration };
    } catch (error) {
        return { success: false, error: error.message, duration: Date.now() - startTime };
    }
}

async function startStressTest(numParticipants = 250) {
    const totalRequests = numParticipants * HEURISTICS.length;
    console.log(`🔥 STARTING FULL BLOWN STRESS TEST`);
    console.log(`👥 Participants: ${numParticipants}`);
    console.log(`📜 Heuristics per User: 10`);
    console.log(`📦 Total AI Requests: ${totalRequests}`);
    console.log(`🚀 Mode: FULL SPEED (No rate limiting)`);
    console.log(`-----------------------------------------------`);

    const startTime = Date.now();
    let completed = 0;
    
    const allAudits = [];
    for (let p = 1; p <= numParticipants; p++) {
        for (const h of HEURISTICS) {
            allAudits.push({ p, h });
        }
    }

    // Fire ALL requests simultaneously
    const promises = allAudits.map(({ p, h }) => {
        return runAudit(p, h).then(res => {
            completed++;
            if (completed % 100 === 0 || completed === totalRequests) {
                const elapsed = (Date.now() - startTime) / 1000;
                console.log(`📊 Progress: ${completed}/${totalRequests} (${elapsed.toFixed(1)}s)`);
            }
            return res;
        });
    });

    const results = await Promise.all(promises);
    const finalDuration = (Date.now() - startTime) / 1000;

    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    const errorCounts = {};
    results.filter(r => !r.success).forEach(r => {
        errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
    });

    console.log(`\n✨ TEST COMPLETED in ${finalDuration.toFixed(1)}s`);
    console.log(`📊 Total Success: ${successes}`);
    console.log(`📊 Total Failures: ${failures}`);
    
    if (failures > 0) {
        console.log(`\n⚠️ Breakdown of Errors:`);
        Object.entries(errorCounts).forEach(([err, count]) => {
            console.log(`- [${count}] ${err}`);
        });
    }
}

startStressTest(250);
