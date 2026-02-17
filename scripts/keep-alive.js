import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables required');
    process.exit(1);
}

const hostname = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

// PATCH to update last_ping (ping_count auto-increments via trigger)
const requestBody = JSON.stringify({
    last_ping: new Date().toISOString()
});

const options = {
    hostname: hostname,
    path: '/rest/v1/keep_alive?id=eq.1',
    method: 'PATCH',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
};

console.log('Sending keep-alive ping...');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
            console.log('✅ Keep-alive successful');
            try {
                const result = JSON.parse(data);
                if (result[0]) {
                    console.log(`Ping count: ${result[0].ping_count}, Last ping: ${result[0].last_ping}`);
                }
            } catch (e) {
                console.log('Ping recorded');
            }
        } else if (res.statusCode === 404) {
            console.error('❌ Table not found. Run: supabase/migrations/keep_alive.sql');
            process.exit(1);
        } else {
            console.error(`❌ Failed (HTTP ${res.statusCode}): ${data}`);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
});

req.write(requestBody);
req.end();
