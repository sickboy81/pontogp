// Script to check if deployed code has the verification fix
import fetch from 'node-fetch';

const SITE_URL = 'https://pontogp.com';

async function checkDeployedCode() {
    try {
        console.log('Fetching index.html from production...');
        const response = await fetch(SITE_URL);
        const html = await response.text();

        // Look for the main JS bundle in the HTML
        const scriptMatch = html.match(/src="\/assets\/(index|main)-([a-z0-9]+)\.js"/i);

        if (scriptMatch) {
            const scriptUrl = `${SITE_URL}/assets/${scriptMatch[0].split('"')[1]}`;
            console.log(`Found main bundle: ${scriptUrl}`);

            // Fetch the JS bundle
            console.log('Fetching JS bundle...');
            const jsResponse = await fetch(scriptUrl);
            const jsCode = await jsResponse.text();

            // Check if the fix is present (looking for "document_verified: false" in registration)
            const hasDocVerifiedFalse = jsCode.includes('document_verified') && jsCode.includes('false');
            const hasVerifiedFalse = jsCode.includes('verified:!1') || jsCode.includes('verified:false');

            console.log('\n--- Deployment Status ---');
            console.log(`Contains "document_verified": ${jsCode.includes('document_verified')}`);
            console.log(`Contains "verified:false" or "verified:!1": ${hasVerifiedFalse}`);
            console.log(`Likely has fix: ${hasDocVerifiedFalse || hasVerifiedFalse}`);

            if (!hasDocVerifiedFalse && !hasVerifiedFalse) {
                console.log('\n⚠️ WARNING: The deployed code may NOT have the verification fix!');
                console.log('Docker image might be cached. Try rebuilding without cache.');
            } else {
                console.log('\n✅ Deployed code appears to have the fix.');
                console.log('Issue might be elsewhere (caching, different code path).');
            }
        } else {
            console.log('❌ Could not find main JS bundle in index.html');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkDeployedCode();
