import http from 'k6/http';
import { sleep, check } from 'k6';

/**
 * Load test for UX Insight Auditor
 * 
 * This script simulates 200 users visiting the landing page.
 * It ramps up to 200 users over 1 minute, holds for 3 minutes, 
 * and then ramps down.
 */

export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '3m', target: 200 }, // Stay at 200 users for 3 minutes
        { duration: '1m', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

export default function () {
    // 1. Visit Home Page
    const homeRes = http.get('https://ux-insight-auditor.web.app/');
    check(homeRes, {
        'homepage status is 200': (r) => r.status === 200,
    });

    // Wait 1-3 seconds between "user" actions
    sleep(Math.random() * 2 + 1);

    // 2. Simulate checking static assets (optional but good for hosting test)
    // http.get('https://ux-insight-auditor.web.app/assets/index.css'); 

    sleep(1);
}
