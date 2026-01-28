/**
 * Email Service
 * Handles sending emails using Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
export default async function sendEmail({ to, subject, html }) {
  try {
    // Development bypass: Skip email sending and log to console
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassEmail = process.env.BYPASS_EMAIL === 'true' || isDevelopment;
    
    if (bypassEmail) {
      // Extract code from HTML for easier viewing
      const codeMatch = html.match(/<h1[^>]*>(\d{6})<\/h1>/);
      const code = codeMatch ? codeMatch[1] : 'N/A';
      
      console.log('\n═══════════════════════════════════════════════════');
      console.log('📧 EMAIL BYPASSED (Development Mode)');
      console.log('═══════════════════════════════════════════════════');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('🔑 Verification Code:', code);
      console.log('═══════════════════════════════════════════════════\n');
      
      return { success: true, dev: true, code };
    }

    // Production: Send via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      html
    });

    if (error) {
      // If Resend fails and we're in development, fall back to console log
      if (isDevelopment) {
        const codeMatch = html.match(/<h1[^>]*>(\d{6})<\/h1>/);
        const code = codeMatch ? codeMatch[1] : 'N/A';
        console.log('\n⚠️  Resend failed, logging to console instead:');
        console.log('🔑 Verification Code:', code);
        console.log('To:', to, '\n');
        return { success: true, dev: true, code };
      }
      
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };

  } catch (error) {
    // In development, if email fails, still log the code
    if (process.env.NODE_ENV === 'development') {
      const codeMatch = html.match(/<h1[^>]*>(\d{6})<\/h1>/);
      const code = codeMatch ? codeMatch[1] : 'N/A';
      console.log('\n⚠️  Email send failed, but here\'s your code:');
      console.log('🔑 Verification Code:', code);
      console.log('To:', to, '\n');
      return { success: true, dev: true, code };
    }
    
    console.error('Email send error:', error);
    throw error;
  }
}

