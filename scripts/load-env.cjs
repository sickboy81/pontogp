
const fs = require('fs');
const path = require('path');

// Tries to load .env from root
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...values] = trimmed.split('=');
            if (key && values.length > 0) {
                const val = values.join('=').trim();
                // Remove quotes if present
                const cleanVal = val.replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) {
                    process.env[key] = cleanVal;
                }
            }
        }
    });
}
