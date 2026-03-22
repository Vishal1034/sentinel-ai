# Email Notification Setup Guide

## How to Receive Email When Spam is Detected

Your Sentinel.ai application is now configured to automatically send email alerts when high-risk scams are detected. Here's how it works:

---

## **How It Works**

1. **Real-Time Detection**: When a call starts and you enable speech recognition, the app continuously analyzes the conversation.

2. **Risk Scoring**: The system calculates a risk score (0-100) based on scam keywords, patterns, and context.

3. **Email Trigger**: When the risk score reaches **75+**, an automatic email is sent to your emergency contact with:
   - The scam reason/type
   - A snippet of the transcript (first 200 characters)
   - Timestamp of detection

4. **Email Prevention**: The system only sends ONE email per call session to prevent email spam.

---

## **Current EmailJS Configuration**

Your app is using **EmailJS** with these credentials:

```javascript
SERVICE_ID = "service_0teurfc"
TEMPLATE_ID = "template_4cwv6uq"
PUBLIC_KEY = "VSOpESty5Un62ITOA"
```

Location: `src/services/emailService.js`

---

## **Email Functions**

### 1. **sendSpamAlert()** (Main Function)
```javascript
// Location: src/services/scamDetector.js
export const sendSpamAlert = async (transcript, analysisResult) => {
  // Sends email only if risk score >= 75
  // Prevents duplicate emails in same session
}
```

**Usage:**
```javascript
await sendSpamAlert(transcript, analysisResult);
```

### 2. **sendSOS()** (Backend Email Sender)
```javascript
// Location: src/services/emailService.js
export const sendSOS = async (scamReason, transcript) => {
  // Actually sends email via EmailJS
}
```

---

## **Email Thresholds**

- **Risk Score < 50**: ❌ No email sent (low risk)
- **Risk Score 50-74**: ⚠️ Monitoring (email not sent yet)
- **Risk Score ≥ 75**: 🚨 **EMAIL SENT** (high-risk spam)

---

## **What Triggers Email Alerts?**

Email is sent when the system detects:

1. **Instant Red Keywords** (Authority Impersonation)
   - "arrest", "police", "CBI", "customs", "legal action"
   - "freeze account", "block account", "deportation"

2. **Secrecy + Urgency Combo** (Very Dangerous)
   - "Don't tell anyone" + "Do it now"
   - "Keep it secret" + "Tonight"

3. **Emotional Manipulation**
   - "Your son had an accident" + "Send money"
   - "You won a lottery" + "Claim prize"

4. **Indirect Payment Requests**
   - KYC verification scams
   - Fake registration fees
   - Gift card requests

5. **Payment Pressure**
   - "Transfer money now"
   - "Pay immediately"
   - "UPI payment urgent"

---

## **How to Customize**

### **Change Email Threshold**
Edit `src/services/scamDetector.js`:
```javascript
// Current: sends email at risk score >= 75
if (analysisResult.riskScore >= 75) {
  // Change 75 to whatever threshold you want
}
```

### **Change Recipient Email**
Edit `src/services/emailService.js`:
```javascript
const templateParams = {
  to_name: "Your Name", // Change this
  // Add more parameters as needed
};
```

### **Test Email Manually**
```javascript
// In browser console:
import { sendSOS } from './src/services/emailService.js';
await sendSOS("Test Alert", "Test transcript content");
```

---

## **Email Content**

The email includes:

| Field | Value |
|-------|-------|
| **Subject** | Depends on EmailJS template |
| **To** | Set in emailService.js `to_name` |
| **Message** | Scam reason (e.g., "Detected arrest threat + payment demand") |
| **Transcript** | First 200 characters of the call |
| **Timestamp** | When email was sent |

---

## **Testing Email Functionality**

1. **Start a call** (click "Start")
2. **Say high-risk keywords**: 
   - Example: "This is officer. Your bank is frozen. Transfer money now."
3. **Watch for:**
   - ❌ Alert sound plays
   - 🔴 Status changes to "SCAM"
   - 📡 SOS banner appears: "SOS SIGNAL SENT TO EMERGENCY CONTACT"
   - 📧 Email sent to your configured recipient

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| Email not sending | Check browser console for errors, verify SERVICE_ID & PUBLIC_KEY in emailService.js |
| Multiple emails per call | This is prevented - only 1 email per session |
| Email never triggers | Make sure risk score reaches 75+ (check console logs) |
| Wrong recipient | Update `to_name` in emailService.js |

---

## **Integration Flow**

```
User speaks on call
       ↓
Speech → Text (transcript)
       ↓
analyzeText() calculates risk score
       ↓
Risk Score ≥ 75?
       ├─ YES → sendSpamAlert()
       │         └─ sendSOS() → EmailJS → Email sent ✅
       │
       └─ NO → Continue monitoring
```

---

## **Next Steps**

1. ✅ Email service is already imported and configured
2. ✅ Detection logic is in place
3. ⚠️ **You need to verify EmailJS credentials are active** in your EmailJS account
4. ⚠️ **Update `to_name` parameter** to send to the correct email

---

## **Security Notes**

- Never commit your EmailJS PUBLIC_KEY to GitHub without protection
- The system only sends emails on high-risk scams (≥75 score)
- One email per session prevents abuse
- Transcript snippets are truncated to first 200 characters for privacy

---

**Updated**: January 26, 2026
