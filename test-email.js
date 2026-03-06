#!/usr/bin/env node

/**
 * Simple email test script to verify Gmail configuration
 * Run with: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD || '';

console.log('=== Email Configuration Test ===\n');
console.log('Gmail User:', GMAIL_USER ? '✓ configured' : '✗ missing');
console.log('Gmail Password:', GMAIL_PASSWORD ? '✓ configured' : '✗ missing');
console.log('Password length:', GMAIL_PASSWORD.length);
console.log('');

if (!GMAIL_USER || !GMAIL_PASSWORD) {
  console.error('❌ Gmail credentials not configured. Cannot test email.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASSWORD,
  },
});

console.log('Verifying Gmail configuration...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration verification failed:');
    console.error(error);
    process.exit(1);
  } else {
    console.log('✓ Email configuration verified successfully!\n');
    
    // Try to send a test email
    console.log('Attempting to send test email...\n');
    
    const testEmail = {
      from: GMAIL_USER,
      to: GMAIL_USER, // Send to self
      subject: 'Test Email from Virtual Chemistry Lab',
      html: `
        <h1>Email Test</h1>
        <p>This is a test email from the Virtual Chemistry Lab backend.</p>
        <p>If you received this, email configuration is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    };

    transporter.sendMail(testEmail, (error, info) => {
      if (error) {
        console.error('❌ Failed to send test email:');
        console.error(error);
        process.exit(1);
      } else {
        console.log('✓ Test email sent successfully!');
        console.log('Response:', info.response);
        console.log('\n=== All checks passed! ===');
        process.exit(0);
      }
    });
  }
});
