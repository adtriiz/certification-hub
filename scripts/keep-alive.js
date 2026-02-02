const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables are required.');
    console.error('Please add them to your GitHub Repository Secrets.');
    process.exit(1);
}

// Extract hostname from URL (e.g., 'xyz.supabase.co' from 'https://xyz.supabase.co')
const hostname = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

const options = {
    hostname: hostname,
    path: '/rest/v1/', // Root of the REST API (PostgREST)
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    }
};

console.log(`Pinging Supabase at https://${hostname}/rest/v1/ ...`);

const req = https.request(options, (res) => {
    console.log(`Response Status Code: ${res.statusCode}`);

    if (res.statusCode >= 200 && res.statusCode < 500) {
        console.log('✅ Supabase project is active and reachable.');
        // Consuming response to free up memory
        res.resume();
    } else {
        console.error('❌ Failed to ping Supabase project.');
        process.exit(1);
    }
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
    process.exit(1);
});

req.end();
