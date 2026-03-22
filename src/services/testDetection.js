// Test file to verify instant red alert detection
import { analyzeText } from './services/scamDetector.js';

const testSentences = [
  // INSTANT RED ALERTS
  "This is Officer Sharma. You are under digital arrest.",
  "We have found drugs in a parcel. You must pay a fine.",
  "I am calling from the CBI. Verify your details.",
  "Your bank account is blocked. Transfer the money now.",
  "Pay the customs duty or we will file a case.",
  "madarchod tere baap ki",
  
  // CONTEXT-BASED (Subtle but dangerous)
  "Listen to me carefully. Go to a private room. Do not tell your family about this call.",
  "Your son is in trouble. He had an accident. Send 500 gift card codes to help him.",
  "Sir, your electricity will be cut tonight unless you update your KYC on WhatsApp.",
  "You have won a lottery. Just pay the registration fee to claim it."
];

console.log("=== SCAM DETECTION TEST ===\n");

testSentences.forEach((sentence, index) => {
  console.log(`Test ${index + 1}: "${sentence}"`);
  const result = analyzeText(sentence);
  console.log(`Risk Score: ${result.riskScore}/100`);
  console.log(`Status: ${result.riskScore > 70 ? '🔴 SCAM' : result.riskScore > 50 ? '🟡 WARNING' : '✅ SAFE'}`);
  console.log(`Emotional Manipulation: ${result.emotionalManipulation ? result.emotionalManipulation.join(', ') : 'None'}`);
  console.log(`Indirect Payment: ${result.indirectPaymentTypes ? result.indirectPaymentTypes.join(', ') : 'None'}`);
  console.log(`Secrecy+Urgency Combo: ${result.secrecyUrgencyCombo ? 'YES' : 'NO'}`);
  console.log('---\n');
});
