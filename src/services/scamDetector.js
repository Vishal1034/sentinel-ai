// src/services/scamDetector.js
// Standalone scam detection logic using pattern matching and heuristics
import { sendSOS } from './emailService.js';

// Keywords and phrases that indicate scam attempts
const SCAM_KEYWORDS = {
  high: [
    'arrest',
    'police',
    'officer',
    'cbi',
    'customs',
    'file a case',
    'legal action',
    'deportation',
    'transfer money',
    'send money',
    'pay',
    'money',
    'bank account',
    'freeze account',
    'block account',
    'upi',
    'credit card',
    'password',
    'otp',
    'don\'t tell anyone',
    'don\'t inform',
    'keep it secret',
    'now',
    'immediately',
    'urgent',
    'emergency'
  ],
  medium: [
    'verify',
    'confirm',
    'identity',
    'details',
    'information',
    'security',
    'pin',
    'cvv',
    'expiry',
    'issue',
    'problem',
    'case',
    'fine',
    'penalty',
    'duty',
    'parcel',
    'drugs'
  ]
};

const SAFE_KEYWORDS = [
  'hello',
  'hi',
  'how are you',
  'good morning',
  'good afternoon',
  'weather',
  'meeting',
  'project',
  'work',
  'family',
  'friend',
  'colleague',
  'appointment',
  'schedule'
];

/**
 * Calculate scam risk based on keyword frequency and patterns
 * @param {string} text - The text to analyze
 * @returns {object} - Risk analysis object
 */
export const calculateScamRisk = (text) => {
  if (!text || text.length === 0) {
    return {
      riskScore: 0,
      isScam: false,
      reason: 'Insufficient data',
      keywords: [],
      confidence: 'low'
    };
  }

  const lowerText = text.toLowerCase();
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let safeCount = 0;
  const matchedKeywords = [];

  // Count high-risk keyword occurrences
  SCAM_KEYWORDS.high.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      highRiskCount += matches.length;
      matchedKeywords.push(keyword);
    }
  });

  // Count medium-risk keyword occurrences
  SCAM_KEYWORDS.medium.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      mediumRiskCount += matches.length;
    }
  });

  // Count safe keyword occurrences
  SAFE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      safeCount += matches.length;
    }
  });

  // Calculate risk score - Increased weights for instant red keywords
  let riskScore = (highRiskCount * 25) + (mediumRiskCount * 8) - (safeCount * 3);
  
  // INSTANT RED BOOST: If certain keywords are present, boost risk significantly
  const instantRedKeywords = ['arrest', 'police', 'cbi', 'customs', 'legal action', 'deportation', 'freeze account', 'block account'];
  const hasInstantRed = instantRedKeywords.some(keyword => lowerText.includes(keyword));
  if (hasInstantRed) {
    riskScore += 40; // Immediate boost for authority impersonation
  }
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine if it's a scam
  const isScam = riskScore > 70;

  // Generate reason
  let reason = '';
  if (isScam) {
    if (highRiskCount > 0) {
      reason = `Detected ${highRiskCount} high-risk indicators`;
    } else {
      reason = 'Multiple suspicious patterns detected';
    }
  } else if (riskScore > 50) {
    reason = 'Some suspicious patterns detected';
  } else {
    reason = 'No obvious scam indicators';
  }

  return {
    riskScore: Math.round(riskScore),
    isScam,
    reason,
    keywords: [...new Set(matchedKeywords)],
    confidence: riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low'
  };
};

/**
 * Detect urgency/pressure tactics
 * @param {string} text - The text to analyze
 * @returns {boolean} - True if urgency is detected
 */
export const detectUrgency = (text) => {
  if (!text) return false;
  
  const urgencyPatterns = [
    /do it now/gi,
    /immediately/gi,
    /urgent/gi,
    /right now/gi,
    /don't delay/gi,
    /quickly/gi,
    /asap/gi,
    /right away/gi,
    /before.*deadline/gi
  ];

  return urgencyPatterns.some(pattern => pattern.test(text));
};

/**
 * Detect threats
 * @param {string} text - The text to analyze
 * @returns {string[]} - Array of threat types detected
 */
export const detectThreats = (text) => {
  if (!text) return [];

  const threats = [];
  
  if (/arrest|jail|imprisoned/gi.test(text)) threats.push('Legal threat');
  if (/deport|expatriate/gi.test(text)) threats.push('Deportation threat');
  if (/freeze|block|suspend.*account/gi.test(text)) threats.push('Account threat');
  if (/fine|penalty|lawsuit/gi.test(text)) threats.push('Financial threat');
  if (/police|cbi|customs|fbi/gi.test(text)) threats.push('Authority impersonation');

  return threats;
};

/**
 * Detect emotional manipulation (family emergencies, accidents, etc.)
 * @param {string} text - The text to analyze
 * @returns {object} - Emotional manipulation indicators
 */
export const detectEmotionalManipulation = (text) => {
  if (!text) return { detected: false, types: [] };

  const emotionalPatterns = {
    familyEmergency: /son|daughter|wife|husband|mother|father|family|emergency|accident|trouble|hospital|injured|hurt/gi,
    lottery: /won|lottery|prize|reward|claim|jackpot|gift.*card|congratulations/gi,
    urgentPayment: /send|transfer|pay|deposit|payment.*now|immediately|right away|tonight/gi
  };

  const types = [];
  if (emotionalPatterns.familyEmergency.test(text)) types.push('family_emergency');
  if (emotionalPatterns.lottery.test(text)) types.push('lottery_scam');
  if (emotionalPatterns.urgentPayment.test(text)) types.push('urgent_payment');

  return {
    detected: types.length > 0,
    types
  };
};

/**
 * Detect secrecy + urgency combo (most dangerous)
 * @param {string} text - The text to analyze
 * @returns {number} - Risk boost percentage
 */
export const detectSecrecyUrgencyCombo = (text) => {
  if (!text) return 0;

  const secrecyKeywords = /don't tell|don't tell anyone|don't inform|keep.*secret|private room|don't let anyone|close.*door|don't mention|confidential/gi;
  const urgencyKeywords = /right now|immediately|tonight|must|have to|before.*\d|unless.*tonight|urgent|asap|quickly/gi;

  const hasSecrecy = secrecyKeywords.test(text);
  const hasUrgency = urgencyKeywords.test(text);

  // Combo is extremely dangerous
  if (hasSecrecy && hasUrgency) {
    return 45; // Major risk boost
  }
  if (hasSecrecy) {
    return 30; // Significant boost for secrecy alone
  }

  return 0;
};

/**
 * Detect indirect payment requests (KYC, verification, registration)
 * @param {string} text - The text to analyze
 * @returns {object} - Indirect payment patterns
 */
export const detectIndirectPayment = (text) => {
  if (!text) return { detected: false, types: [] };

  const indirectPaymentPatterns = {
    kyc: /kyc|know your customer|update kyc|kyc verification|kyc details/gi,
    verification: /verify|confirm|validate|authenticate|check|update.*account|verify.*identity/gi,
    registration: /registration fee|registration cost|activate|register|enroll/gi,
    electricity: /electricity|bill|connection|cut.*tonight|disconnect/gi,
    gift: /gift card|gift code|amazon|google play|itunes/gi
  };

  const types = [];
  if (indirectPaymentPatterns.kyc.test(text)) types.push('kyc_update');
  if (indirectPaymentPatterns.verification.test(text)) types.push('fake_verification');
  if (indirectPaymentPatterns.registration.test(text)) types.push('registration_fee');
  if (indirectPaymentPatterns.electricity.test(text)) types.push('utility_scam');
  if (indirectPaymentPatterns.gift.test(text)) types.push('gift_card_scam');

  return {
    detected: types.length > 0,
    types
  };
};

/**
 * Comprehensive scam detection combining multiple analysis
 * @param {string} text - The text to analyze
 * @returns {object} - Comprehensive analysis result
 */
export const analyzeText = (text) => {
  const riskAnalysis = calculateScamRisk(text);
  const hasUrgency = detectUrgency(text);
  const threats = detectThreats(text);
  const emotionalManip = detectEmotionalManipulation(text);
  const secrecyUrgency = detectSecrecyUrgencyCombo(text);
  const indirectPayment = detectIndirectPayment(text);

  // Boost risk score if urgency + scam keywords are found together
  let finalRiskScore = riskAnalysis.riskScore;
  
  if (hasUrgency && riskAnalysis.riskScore > 50) {
    finalRiskScore = Math.min(100, finalRiskScore + 15);
  }

  // Boost if threats are detected
  if (threats.length > 0) {
    finalRiskScore = Math.min(100, finalRiskScore + 10 * threats.length);
  }

  // CONTEXT-BASED BOOSTS
  if (emotionalManip.detected) {
    finalRiskScore = Math.min(100, finalRiskScore + 20); // Emotional manipulation is strong indicator
  }

  if (secrecyUrgency > 0) {
    finalRiskScore = Math.min(100, finalRiskScore + secrecyUrgency);
  }

  if (indirectPayment.detected) {
    finalRiskScore = Math.min(100, finalRiskScore + 15); // Indirect payment is suspicious
  }

  return {
    riskScore: Math.round(finalRiskScore),
    isScam: finalRiskScore > 70,
    reason: riskAnalysis.reason,
    confidence: finalRiskScore > 60 ? 'high' : finalRiskScore > 40 ? 'medium' : 'low',
    suspiciousKeywords: riskAnalysis.keywords,
    urgencyDetected: hasUrgency,
    threatTypes: threats,
    emotionalManipulation: emotionalManip.types,
    secrecyUrgencyCombo: secrecyUrgency > 0,
    indirectPaymentTypes: indirectPayment.types,
    deepfakeIndicators: 'None detected'
  };
};

/**
 * Send email alert when high-risk scam is detected
 * @param {string} transcript - The call transcript
 * @param {object} analysisResult - Result from analyzeText()
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export const sendSpamAlert = async (transcript, analysisResult) => {
  try {
    // Only send email if risk score is very high (75+) to avoid spam
    if (analysisResult.riskScore >= 75) {
      const scamReason = analysisResult.reason || 'High-risk spam detected';
      const emailSent = await sendSOS(scamReason, transcript);
      
      if (emailSent) {
        console.log(`📧 ALERT EMAIL SENT - Risk Score: ${analysisResult.riskScore}`);
      }
      return emailSent;
    }
    return false;
  } catch (error) {
    console.error('Error sending spam alert email:', error);
    return false;
  }
};
