// src/services/emailService.js
import emailjs from '@emailjs/browser';

// EmailJS Credentials
const publicKey = import.meta.env.VITE_EMAIL_API_KEY;
const serviceId = import.meta.env.VITE_EMAIL_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAIL_TEMPLATE_ID;

export const sendSOS = async (scamReason, transcript) => {
  try {
    const templateParams = {
      to_name: "Emergency Contact", // In a real app, user sets this
      message: `URGENT: High-risk call detected. Reason: ${scamReason}`,
      transcript_snippet: transcript.substring(0, 200) + "...",
      timestamp: new Date().toLocaleString(),
    };

    console.log("🚀 SENDING SOS EMAIL:", templateParams);
    
    // Send real email through EmailJS
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    return true;
  } catch (error) {
    console.error("SOS Failed:", error);
    return false;
  }
};
