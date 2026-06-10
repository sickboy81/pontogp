
import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = process.env.VITE_APP_URL || 'https://cerejavip.com';
// Allow overriding output path via ENV, default to local public dir
const DEFAULT_PATH = path.resolve(__dirname, '../public/sitemap.xml');
const SITEMAP_PATH = process.env.SITEMAP_OUTPUT_PATH || DEFAULT_PATH;

async function generateSitemap() {
    console.log('🗺️  Starting sitemap generation...');

    try {
        const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'https://pocketbase.cerejavip.com');

        // 1. Fetch only active profiles
        const records = await pb.collection('profiles').getFullList({
            filter: 'status = "active"',
            requestKey: null
        });

        console.log(`Found ${records.length} active profiles.`);

        // 2. Define static routes
        const staticRoutes = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/sobre', changefreq: 'monthly', priority: 0.8 },
            { url: '/planos', changefreq: 'monthly', priority: 0.8 },
            { url: '/termos', changefreq: 'monthly', priority: 0.5 },
            { url: '/privacidade', changefreq: 'monthly', priority: 0.5 },
            { url: '/seguranca', changefreq: 'monthly', priority: 0.7 },
            { url: '/contato', changefreq: 'monthly', priority: 0.6 }
        ];

        // 3. Build XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Prepare base URL (ensure no trailing slash for safe joining)
        const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;

        // Add static routes
        staticRoutes.forEach(route => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
            xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
            xml += `    <priority>${route.priority.toFixed(1)}</priority>\n`;
            xml += '  </url>\n';
        });

        // Add profile routes
        records.forEach(record => {
            // Use date_created or created or updated
            const dateStr = record.updated || record.date_updated || record.created || record.date_created || new Date().toISOString();

            let lastMod;
            try {
                const dateObj = new Date(dateStr);
                if (isNaN(dateObj.getTime())) throw new Error('Invalid date');
                lastMod = dateObj.toISOString().split('T')[0];
            } catch (e) {
                lastMod = new Date().toISOString().split('T')[0];
            }

            xml += '  <url>\n';
            // Use the profile ID for the URL as per current app routing
            xml += `    <loc>${SITE_URL}/perfil/${record.id}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.9</priority>\n';
            xml += '  </url>\n';
        });
        xml += '</urlset>';

        // 4. Write to file
        fs.writeFileSync(SITEMAP_PATH, xml);
        console.log(`✅ Sitemap generated successfully at ${SITEMAP_PATH}`);
        console.log(`   Total URLs: ${staticRoutes.length + records.length}`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
        process.exit(1);
    }
}

generateSitemap();
