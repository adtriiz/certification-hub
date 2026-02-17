#!/usr/bin/env node
/**
 * Monitor keep-alive status
 * Usage: SUPABASE_URL=<url> SUPABASE_KEY=<key> node scripts/monitor.js
 */

import https from 'https';

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY required');
    process.exit(1);
}

const hostname = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

const req = https.request({
    hostname,
    path: '/rest/v1/keep_alive?select=*',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: HTTP ${res.statusCode}`);
            process.exit(1);
        }
        
        try {
            const rows = JSON.parse(data);
            if (!rows.length) {
                console.log('No data found');
                process.exit(1);
            }
            
            const { last_ping, ping_count } = rows[0];
            const lastPing = new Date(last_ping);
            const minutesAgo = Math.floor((Date.now() - lastPing) / 60000);
            
            console.log(`Last ping: ${last_ping}`);
            console.log(`Minutes ago: ${minutesAgo}`);
            console.log(`Total pings: ${ping_count}`);
            console.log(`Status: ${minutesAgo > 2880 ? 'OVERDUE (>48h)' : 'OK'}`);
            
            process.exit(minutesAgo > 2880 ? 1 : 0);
        } catch (e) {
            console.error('Parse error:', e.message);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
    process.exit(1);
});

req.end();
