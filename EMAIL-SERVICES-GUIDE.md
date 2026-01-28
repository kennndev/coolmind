# Email Services Setup Guide 📧

SendGrid giving you trouble? No worries! Here are **4 easy alternatives**, ranked from easiest to hardest:

---

## 🥇 Option 1: Resend (RECOMMENDED)

**Why Choose This:**
- ✅ Easiest setup (literally 5 minutes)
- ✅ 3,000 emails/month FREE
- ✅ No domain verification needed
- ✅ Works immediately after signup
- ✅ Modern, clean API
- ✅ Great for both development AND production

### Setup Steps:

**1. Sign up for Resend**
```
https://resend.com/signup
```

**2. Get your API key**
- After signup, you'll see your API key on the dashboard
- Copy it immediately!

**3. Install Resend package**
```bash
npm install resend
```

**4. Update your .env file**
```env
# Email Service
EMAIL_SERVICE=resend
RESEND_API_KEY=re_123456789abcdefghijk
FROM_EMAIL=MindFlow <onboarding@resend.dev>

# For custom domain (optional):
# FROM_EMAIL=MindFlow <noreply@yourdomain.com>
```

**5. Update auth-routes.js to use new email service**
```javascript
// At the top of auth-routes.js
// REPLACE THIS LINE:
const sendEmail = require('./emailService');

// WITH THIS:
const { sendVerificationCode } = require('./emailService-resend');
```

**6. Update the sendEmail call in auth-routes.js**

Find this section (around line 110-126):
```javascript
// OLD CODE - Remove this:
await sendEmail({
  to: normalizedEmail,
  subject: 'Your MindFlow Login Code',
  html: `...long HTML...`
});

// NEW CODE - Replace with this:
await sendVerificationCode(normalizedEmail, code);
```

**That's it!** ✅ You're done. Test it immediately.

---

## 🥈 Option 2: Gmail SMTP (Easiest, but limited)

**Why Choose This:**
- ✅ Super easy if you have Gmail
- ✅ 100% FREE
- ✅ No signup needed (use your Gmail)
- ✅ Works instantly
- ⚠️ Limited to 500 emails/day
- ⚠️ Gmail branding in emails

### Setup Steps:

**1. Enable 2-Factor Authentication on your Gmail**
- Go to: https://myaccount.google.com/security
- Turn on 2-Step Verification

**2. Create App Password**
- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and "Other (Custom name)"
- Enter "MindFlow App"
- Copy the 16-character password

**3. Install nodemailer**
```bash
npm install nodemailer
```

**4. Update your .env file**
```env
# Email Service
EMAIL_SERVICE=gmail
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```
**Important:** Use the 16-character app password, NOT your regular Gmail password!

**5. Update auth-routes.js**
```javascript
// At the top of auth-routes.js
// REPLACE:
const sendEmail = require('./emailService');

// WITH:
const { sendVerificationCode } = require('./emailService-gmail');
```

**6. Update the sendEmail call** (same as Resend - step 6 above)

---

## 🥉 Option 3: Brevo (formerly Sendinblue)

**Why Choose This:**
- ✅ 300 emails/day FREE
- ✅ Easy signup
- ✅ No verification needed
- ✅ Good for production
- ⚠️ Need to create account

### Setup Steps:

**1. Sign up for Brevo**
```
https://app.brevo.com/account/register
```

**2. Get API Key**
- After signup, go to: https://app.brevo.com/settings/keys/api
- Click "Generate a new API key"
- Copy it

**3. Install Brevo SDK**
```bash
npm install sib-api-v3-sdk
```

**4. Update your .env file**
```env
# Email Service
EMAIL_SERVICE=brevo
BREVO_API_KEY=xkeysib-123456789abcdefghijk
FROM_EMAIL=noreply@yourdomain.com
```

**5. Update auth-routes.js**
```javascript
// At the top
// REPLACE:
const sendEmail = require('./emailService');

// WITH:
const { sendVerificationCode } = require('./emailService-brevo');
```

**6. Update the sendEmail call** (same as above)

---

## 🧪 Option 4: Mailtrap (Development Only)

**Why Choose This:**
- ✅ Perfect for development/testing
- ✅ FREE unlimited emails
- ✅ Catches all emails in fake inbox
- ⚠️ Emails DON'T actually send (they're caught in Mailtrap)
- ❌ NOT for production

### Setup Steps:

**1. Sign up for Mailtrap**
```
https://mailtrap.io/register/signup
```

**2. Get SMTP credentials**
- Go to: https://mailtrap.io/inboxes
- Click your inbox
- Copy the SMTP credentials

**3. Install nodemailer**
```bash
npm install nodemailer
```

**4. Update your .env file**
```env
# Email Service
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=1234567890abcd
MAILTRAP_PASSWORD=1234567890abcd
```

**5. Update auth-routes.js**
```javascript
// At the top
// REPLACE:
const sendEmail = require('./emailService');

// WITH:
const { sendVerificationCode } = require('./emailService-mailtrap');
```

**6. Update the sendEmail call** (same as above)

**7. View emails in Mailtrap inbox**
- Go to: https://mailtrap.io/inboxes
- All your test emails will appear here!

---

## Complete Code Changes

### Update auth-routes.js

Here's exactly what to change in your `auth-routes.js`:

```javascript
// ========================================
// AT THE TOP OF THE FILE (around line 14)
// ========================================

// OLD (REMOVE THIS):
const sendEmail = require('./emailService');

// NEW (PICK ONE):

// For Resend:
const { sendVerificationCode } = require('./emailService-resend');

// For Gmail:
const { sendVerificationCode } = require('./emailService-gmail');

// For Brevo:
const { sendVerificationCode } = require('./emailService-brevo');

// For Mailtrap:
const { sendVerificationCode } = require('./emailService-mailtrap');


// ========================================
// IN THE /request-code ROUTE (around line 110-126)
// ========================================

// OLD CODE (REMOVE THIS ENTIRE BLOCK):
await sendEmail({
  to: normalizedEmail,
  subject: 'Your MindFlow Login Code',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">MindFlow Login</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 36px; letter-spacing: 8px; color: #667eea;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      ${isNewUser ? '<p><strong>Welcome to MindFlow!</strong> After verification, you\'ll be asked to complete your profile.</p>' : ''}
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        If you didn't request this code, please ignore this email.
      </p>
    </div>
  `
});

// NEW CODE (ONE LINE!):
await sendVerificationCode(normalizedEmail, code);
```

That's it! The new email services have nicer templates built-in.

---

## Testing Your Email Service

### 1. Start your backend server
```bash
node server.js
# or
npm start
```

### 2. Test from your app
```bash
# In another terminal
npm run dev
```

### 3. Try logging in
- Open: http://localhost:5173
- Enter your email
- Check for verification code:
  - **Resend/Gmail/Brevo**: Check your actual email inbox
  - **Mailtrap**: Check https://mailtrap.io/inboxes

### 4. Expected behavior
```
1. User enters email
   ↓
2. Backend generates 6-digit code
   ↓
3. Backend calls sendVerificationCode()
   ↓
4. Email service sends email
   ↓
5. You receive code
   ↓
6. Enter code and login! ✅
```

---

## Comparison Table

| Service | Free Tier | Setup Time | Best For |
|---------|-----------|------------|----------|
| **Resend** | 3,000/month | 5 min | 🥇 Production & Dev |
| **Gmail** | 500/day | 3 min | 🥈 Quick testing |
| **Brevo** | 300/day | 5 min | 🥉 Production |
| **Mailtrap** | Unlimited | 5 min | 🧪 Development only |

---

## My Recommendation

**For Quick Testing (Right Now):**
```
Use Gmail SMTP ✅
- Takes 3 minutes
- Works immediately
- No signup needed
```

**For Development & Production:**
```
Use Resend ✅
- 5 minute setup
- 3,000 emails/month free
- Professional emails
- Scales with your app
```

**For Pure Development:**
```
Use Mailtrap ✅
- Perfect for testing
- Unlimited emails
- See all emails in inbox
```

---

## Environment Variables Summary

### Resend:
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=MindFlow <onboarding@resend.dev>
```

### Gmail:
```env
EMAIL_SERVICE=gmail
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Brevo:
```env
EMAIL_SERVICE=brevo
BREVO_API_KEY=xkeysib-xxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

### Mailtrap:
```env
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=xxxxxxxxxx
MAILTRAP_PASSWORD=xxxxxxxxxx
```

---

## Troubleshooting

### "Email not received"
- **Gmail**: Check spam folder, check app password is correct
- **Resend**: Check API key is valid
- **Brevo**: Check API key is valid
- **Mailtrap**: Check https://mailtrap.io/inboxes

### "Authentication failed"
- Check your API key/password in .env
- Make sure there are no extra spaces
- Gmail: Use app password, not regular password

### "Module not found"
- Run: `npm install resend` (or nodemailer, or sib-api-v3-sdk)
- Restart your server

### "From email rejected"
**Resend**: Use `onboarding@resend.dev` for testing (no verification needed)
**Gmail**: Use your Gmail address
**Brevo/Mailtrap**: Can use any email for testing

---

## Quick Start (Copy & Paste)

### For Resend (5 minutes):
```bash
# 1. Install
npm install resend

# 2. Add to .env
echo "RESEND_API_KEY=re_YOUR_KEY_HERE" >> .env
echo "EMAIL_SERVICE=resend" >> .env

# 3. Update auth-routes.js line 14
# Change: const sendEmail = require('./emailService');
# To: const { sendVerificationCode } = require('./emailService-resend');

# 4. Update auth-routes.js line 110-126
# Replace the sendEmail() call with: await sendVerificationCode(normalizedEmail, code);

# Done! 🎉
```

### For Gmail (3 minutes):
```bash
# 1. Install
npm install nodemailer

# 2. Get app password from https://myaccount.google.com/apppasswords

# 3. Add to .env
echo "GMAIL_USER=your.email@gmail.com" >> .env
echo "GMAIL_APP_PASSWORD=your-app-password" >> .env
echo "EMAIL_SERVICE=gmail" >> .env

# 4. Update auth-routes.js (same as Resend above, but use emailService-gmail)

# Done! 🎉
```

---

## Need Help?

**Can't decide?** → Use Resend 🎯
**Need it NOW?** → Use Gmail ⚡
**Just testing?** → Use Mailtrap 🧪

Pick one and let me know if you run into any issues! 🚀
