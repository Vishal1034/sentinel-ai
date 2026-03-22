// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import Webcam from "react-webcam";

import { checkScamWithAI, checkImageWithAI } from "./services/gemini";
import { analyzeText, sendSpamAlert } from "./services/scamDetector";
import { generatePDF } from "./services/pdfGenerator";

import { createModel, trainModel, predictScam } from "./ml/model";

import "./App.css";

function App() {
  /* ================= SPEECH ================= */
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript
  } = useSpeechRecognition();

  /* ================= CORE STATES ================= */
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("SAFE");
  const [reason, setReason] = useState("Waiting to start...");
  const [riskScore, setRiskScore] = useState(0);

  /* ================= DEBOUNCE ================= */
  const [stableTranscript, setStableTranscript] = useState("");

  /* ================= ML ================= */
  const [mlReady, setMlReady] = useState(false);

  /* ================= UI EXPLAINABILITY ================= */
  const [engineUsed, setEngineUsed] = useState("—");
  const [mlConfidence, setMlConfidence] = useState(0);
  const [triggeredFeatures, setTriggeredFeatures] = useState([]);
  const [decisionTimeline, setDecisionTimeline] = useState([]);

  /* ================= EMAIL ================= */
  const emailLock = useRef(false);
  const lastEmailTime = useRef(0);
  const EMAIL_COOLDOWN = 60000;

  /* ================= CAMERA ================= */
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  /* =====================================================
     1️⃣ INIT & TRAIN ML (RUNS ONCE)
     ===================================================== */
  useEffect(() => {
    const initML = async () => {
      createModel();
      await trainModel();
      setMlReady(true);
      console.log("🧠 ML model ready");
    };
    initML();
  }, []);

  /* =====================================================
     2️⃣ START / STOP SPEECH
     ===================================================== */
  const handleStart = () => {
    resetTranscript();
    setStableTranscript("");
    setIsActive(true);
    setStatus("SAFE");
    setReason("Monitoring call...");
    setRiskScore(0);

    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language: "en-IN"
    });
  };

  const handleStop = () => {
    setIsActive(false);
    SpeechRecognition.stopListening();
  };

  const handleClear = () => {
    handleStop();
    resetTranscript();
    setStableTranscript("");
    setStatus("SAFE");
    setReason("Waiting to start...");
    setRiskScore(0);
    setEngineUsed("—");
    setMlConfidence(0);
    setTriggeredFeatures([]);
    setDecisionTimeline([]);
    emailLock.current = false;
    lastEmailTime.current = 0;
  };

  /* =====================================================
     3️⃣ AUTO-RESTART (CHROME SILENCE FIX)
     ===================================================== */
  useEffect(() => {
    SpeechRecognition.onend = () => {
      if (isActive) {
        SpeechRecognition.startListening({
          continuous: true,
          interimResults: true,
          language: "en-IN"
        });
      }
    };
  }, [isActive]);

  /* =====================================================
     4️⃣ DEBOUNCE TRANSCRIPT
     ===================================================== */
  useEffect(() => {
    if (!isActive || transcript.length < 15) return;

    const t = setTimeout(() => {
      setStableTranscript(transcript);
    }, 2000);

    return () => clearTimeout(t);
  }, [transcript, isActive]);

  /* =====================================================
     5️⃣ HYBRID AI DECISION (ML → GEMINI)
     ===================================================== */
  useEffect(() => {
    if (!stableTranscript || !mlReady) return;

    const analyze = async () => {
      setStatus("CHECKING");
      const startTime = performance.now();

      const mlScore = predictScam(stableTranscript);
      const mlPercent = Math.round(mlScore * 100);
      setMlConfidence(mlPercent);

      const features = [];
      if (mlScore > 0.6) features.push("Urgency / Payment Pattern");
      if (
        stableTranscript.includes("police") ||
        stableTranscript.includes("cbi") ||
        stableTranscript.includes("bank")
      ) {
        features.push("Authority Impersonation");
      }
      setTriggeredFeatures(features);

      let analysis;

      if (mlScore > 0.8) {
        setEngineUsed("Local ML Model");
        analysis = {
          riskScore: mlPercent,
          reason: "ML detected scam pattern"
        };
      } else {
        setEngineUsed("ML + Gemini AI");
        try {
          analysis = await checkScamWithAI(stableTranscript);
        } catch {
          analysis = analyzeText(stableTranscript);
        }
      }

      const endTime = performance.now();
      setDecisionTimeline([
        "🎤 Audio Captured",
        "🧠 ML Evaluated",
        engineUsed === "ML + Gemini AI" ? "🤖 Gemini Verified" : null,
        `🚨 Decision in ${(endTime - startTime).toFixed(1)} ms`
      ].filter(Boolean));

      if (analysis.riskScore > 70) {
        setStatus("SCAM");
        setReason(analysis.reason.toUpperCase());
        setRiskScore(analysis.riskScore);

        const now = Date.now();
        if (!emailLock.current && now - lastEmailTime.current > EMAIL_COOLDOWN) {
          await sendSpamAlert(stableTranscript, analysis);
          emailLock.current = true;
          lastEmailTime.current = now;
        }
      } else {
        setStatus("SAFE");
        setReason("VERIFIED SAFE CONVERSATION");
        setRiskScore(analysis.riskScore || 0);
      }
    };

    analyze();
  }, [stableTranscript, mlReady]);

  /* =====================================================
     6️⃣ IMAGE SCAN
     ===================================================== */
  const captureAndAnalyze = async () => {
    if (!webcamRef.current) return;

    setIsScanning(true);
    const image = webcamRef.current.getScreenshot();
    const result = await checkImageWithAI(image);
    setIsScanning(false);
    setShowCamera(false);

    if (result.isScam) {
      setStatus("SCAM");
      setReason(result.reason.toUpperCase());
      setRiskScore(result.confidence);
    } else {
      setStatus("SAFE");
      setReason("IMAGE VERIFIED SAFE");
      setRiskScore(0);
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */
  if (!browserSupportsSpeechRecognition) {
    return <h2>Use Chrome. Speech recognition not supported.</h2>;
  }

  return (
    <div className={`app-container ${status.toLowerCase()}`}>
      {/* ===== HEADER WITH LOGO ===== */}
      <div className="header">
        <img
          src="/logo.png"
          alt="Sentinel.ai Logo"
          className="app-logo"
        />
        <h1>Sentinel.ai</h1>
        <p>Real-Time Scam Interceptor</p>
      </div>

      <div className="controls">
        {!isActive ? (
          <button onClick={handleStart}>START</button>
        ) : (
          <button onClick={handleStop}>STOP</button>
        )}
        <button onClick={handleClear}>CLEAR</button>
      </div>

      {/* ================= STATUS BOX ================= */}
      <div className="status-box">
        <h2>{status}</h2>
        <p className="reason-text">{reason}</p>
        {riskScore > 0 && <p>Risk Level: {riskScore}%</p>}

        <div className="soc-panel">
          <h4>DETECTION ENGINE</h4>
          <p>Engine Used: <span>{engineUsed}</span></p>
          <p>ML Confidence: <span>{mlConfidence}%</span></p>
        </div>

        <div className="soc-panel">
          <h4>ML FEATURE TRIGGERS</h4>
          {triggeredFeatures.length ? (
            <ul>
              {triggeredFeatures.map((f, i) => (
                <li key={i}>⚠ {f}</li>
              ))}
            </ul>
          ) : (
            <p>None Detected</p>
          )}
        </div>

        <div className="pipeline">
          <span>🎤 Audio</span> → <span>🧠 ML</span> → <span>🤖 Gemini</span> → <span className="final">🚨 Decision</span>
        </div>

        <div className="soc-panel">
          <h4>DECISION TIMELINE</h4>
          <ul>
            {decisionTimeline.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        {status === "SCAM" && (
          <button
            className="download-btn"
            onClick={() => generatePDF(stableTranscript, reason)}
          >
            DOWNLOAD FIR REPORT
          </button>
        )}
      </div>

      {/* ================= TRANSCRIPT ================= */}
      <div className="transcript-box">
        <h3>Live Audio Transcript</h3>
        <p>{transcript || "Transcript will appear here..."}</p>
        {listening && isActive && <span className="listening-dot">Listening...</span>}
      </div>

      {/* ================= CAMERA ================= */}
      <div className="camera-section">
        {!showCamera ? (
          <button className="scan-btn" onClick={() => setShowCamera(true)}>
            SCAN IMAGE
          </button>
        ) : (
          <div className="camera-overlay">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="webcam-view" />
            <div className="camera-controls">
              <button className="scan-btn danger" onClick={captureAndAnalyze} disabled={isScanning}>
                {isScanning ? "ANALYZING..." : "DETECT"}
              </button>
              <button className="scan-btn" onClick={() => setShowCamera(false)}>
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
