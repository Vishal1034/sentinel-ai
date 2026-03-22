// src/services/voiceAnalysis.js
// Analyzes voice characteristics to detect deepfakes and unnatural speech

export const analyzeVoicePatterns = (audioContext) => {
  // Analyzes real-time audio characteristics
  if (!audioContext || !audioContext.analyser) {
    return {
      artifactScore: 0,
      naturalness: 100,
      suspiciousPatterns: [],
      confidence: 'low'
    };
  }

  const dataArray = new Uint8Array(audioContext.analyser.frequencyBinCount);
  audioContext.analyser.getByteFrequencyData(dataArray);

  // Deepfake detection indicators
  let artifactScore = 0;
  let suspiciousPatterns = [];

  // 1. Check for unusual frequency patterns (AI-generated voices often have unnatural patterns)
  const avgFrequency = dataArray.reduce((a, b) => a + b) / dataArray.length;
  const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - avgFrequency, 2)) / dataArray.length;
  const stdDev = Math.sqrt(variance);

  // Deepfakes often have suspiciously uniform frequency distribution
  if (stdDev < 15) {
    artifactScore += 20;
    suspiciousPatterns.push('Unnatural frequency patterns');
  }

  // 2. Check for robotic/metallic quality (high frequency artifacts)
  const highFreqEnergy = dataArray.slice(200).reduce((a, b) => a + b) / dataArray.slice(200).length;
  if (highFreqEnergy > 180) {
    artifactScore += 15;
    suspiciousPatterns.push('Possible audio artifacts');
  }

  // 3. Check for suspiciously perfect clarity
  if (avgFrequency > 120 && stdDev < 20) {
    artifactScore += 10;
    suspiciousPatterns.push('Too-perfect audio clarity');
  }

  const naturalness = Math.max(0, 100 - artifactScore);

  return {
    artifactScore: Math.min(100, artifactScore),
    naturalness,
    suspiciousPatterns,
    confidence: suspiciousPatterns.length > 0 ? 'medium' : 'low'
  };
};

export const deepfakeRiskAssessment = (voiceAnalysis, textAnalysis) => {
  // Combines voice analysis with text analysis for comprehensive deepfake detection
  
  if (!voiceAnalysis || voiceAnalysis.confidence === 'low') {
    return {
      deepfakeRisk: 0,
      reason: 'Voice analysis inconclusive'
    };
  }

  let deepfakeRisk = voiceAnalysis.artifactScore * 0.7; // 70% weight on voice artifacts

  // If text is scam AND voice has artifacts = very suspicious
  if (textAnalysis && textAnalysis.riskScore > 60) {
    deepfakeRisk += 15; // Boost risk if text analysis also flagged
  }

  return {
    deepfakeRisk: Math.min(100, deepfakeRisk),
    reason: voiceAnalysis.suspiciousPatterns.join(', ') || 'Voice appears natural'
  };
};
