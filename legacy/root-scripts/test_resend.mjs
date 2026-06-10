// Test Resend email sending
// Run: node scripts/test_resend.mjs

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_SMTP_PASSWORD;

if (!apiKey) {
    console.error('Defina RESEND_API_KEY ou EMAIL_SMTP_PASSWORD para testar o envio.');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
    console.log('Testing Resend email...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>', // Use Resend's test domain
            to: ['egeohub101@gmail.com'], // Change to your email
            subject: 'Test Email from PontoGP',
            html: '<h1>Hello!</h1><p>This is a test email from Resend.</p>',
        });

        if (error) {
            console.error('Resend error:', error);
            return;
        }

        console.log('Email sent successfully!');
        console.log('Data:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

testEmail();
