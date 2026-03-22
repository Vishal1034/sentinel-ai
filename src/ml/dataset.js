// src/ml/dataset.js

// 1. DEFINE VOCABULARY GLOBALLY
// We export this so the Model knows the input shape automatically.
export const VOCABULARY = [
  // Danger Words
  "transfer", "money", "arrest", "police", "kyc", "bank", "blocked", 
  "lottery", "otp", "customs", "cbi", "cut", "electricity", "gift",
  
  // Safe Context Words (These stop false alarms)
  "passport", "photos", "laptop", "groceries", "school", "fees", 
  "helped", "phone", "forgot", "password", "office", "dinner", 
  "weather", "mom", "home", "plan", "lost"
];

// 2. EXPORT THE LENGTH (Crucial Fix for the "Shape Mismatch" error)
export const VOCAB_LENGTH = VOCABULARY.length; 

export const TRAINING_DATA = [
  // --- CLEAR SCAMS (Label 1) ---
  { text: "transfer money immediately or arrest", label: 1 },
  { text: "police verification pending pay now", label: 1 },
  { text: "your bank account is blocked update kyc", label: 1 },
  { text: "cbi inquiry against you download teamviewer", label: 1 },
  { text: "customs duty unpaid for parcel click link", label: 1 },
  { text: "you won a lottery pay registration fee", label: 1 },
  { text: "otp verification for refund share details", label: 1 },
  { text: "sir your electricity will be cut tonight", label: 1 },
  { text: "child in trouble send gift card codes", label: 1 },
  
  // --- TRICKY SAFE CASES (Label 0) ---
  { text: "i am going to the police station for passport verification", label: 0 },
  { text: "can you transfer the photos to my laptop", label: 0 },
  { text: "i need to withdraw money from the bank for groceries", label: 0 },
  { text: "did you pay the school fees yet", label: 0 },
  { text: "the police helped me find my lost phone", label: 0 },
  { text: "my account was blocked because i forgot the password", label: 0 },
  { text: "is the customs office open today", label: 0 },
  { text: "i lost my lottery ticket unfortunately", label: 0 },

  // --- NORMAL CONVERSATION (Label 0) ---
  { text: "hey how are you doing today", label: 0 },
  { text: "what is the plan for dinner", label: 0 },
  { text: "happy birthday my dear friend", label: 0 },
  { text: "the weather is very nice outside", label: 0 },
  { text: "call mom when you reach home", label: 0 }
];

// 3. UPDATED TOKENIZER
export const tokenize = (text) => {
  // Use the dynamic length instead of hardcoding '21'
  const vector = new Array(VOCAB_LENGTH).fill(0);
  
  text.toLowerCase().split(" ").forEach(word => {
    const index = VOCABULARY.indexOf(word);
    if (index !== -1) {
      vector[index] = 1; 
    }
  });
  
  return vector;
};