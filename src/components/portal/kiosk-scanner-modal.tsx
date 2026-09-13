"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Keyboard,
  X,
  Zap,
  ZapOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Dumbbell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memberSelfScanKioskAction } from "@/lib/api/attendance";
import { playSuccessChime, playDeniedBuzz, playDuplicateNotice } from "@/lib/kiosk/audio";
import jsQR from "jsqr";

interface KioskScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess?: (data: any) => void;
  memberUid?: string;
}

export function KioskScannerModal({
  open,
  onClose,
  onScanSuccess,
  memberUid,
}: KioskScannerModalProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Manual code state
  const [manualCode, setManualCode] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Result state
  const [scannedResult, setScannedResult] = useState<{
    success: boolean;
    duplicate?: boolean;
    expired?: boolean;
    message: string;
    mode?: "entry" | "exit";
    athleteName?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannedResult(null);
      setManualCode("");
      return;
    }

    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, mode]);

  const startCamera = async () => {
    setCameraError(null);
    setHasCamera(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));

      setHasCamera(true);
      setScanning(true);
      requestScanFrame();
    } catch (err: any) {
      setHasCamera(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Use the manual station code tab or grant camera access."
          : err.message || "Failed to initialize camera"
      );
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {}
  };

  const requestScanFrame = () => {
    animFrameRef.current = requestAnimationFrame(scanTick);
  };

  const scanTick = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (open && mode === "camera") requestScanFrame();
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      if (open && mode === "camera") requestScanFrame();
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleCodeDetected(code.data);
      return;
    }

    if (open && mode === "camera") {
      requestScanFrame();
    }
  };

  const handleCodeDetected = async (rawCode: string) => {
    setScanning(false);

    try {
      const res: any = await memberSelfScanKioskAction({
        qrToken: rawCode,
        kioskToken: rawCode,
      });

      if (res.success) {
        if (res.duplicate) {
          playDuplicateNotice();
        } else {
          playSuccessChime();
        }
        setScannedResult({
          success: true,
          duplicate: res.duplicate,
          message: res.message || "Access Verified!",
          mode: res.mode,
          athleteName: res.memberName,
        });
        if (onScanSuccess) {
          onScanSuccess(res);
        }
      } else {
        playDeniedBuzz();
        setScannedResult({
          success: false,
          expired: res.expired,
          message: res.message || "Check-in could not be approved",
        });
      }
    } catch (err: any) {
      playDeniedBuzz();
      setScannedResult({
        success: false,
        message: err.message || "Connection error. Please try again.",
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim().toUpperCase();
    if (!clean) return;

    setIsSubmittingManual(true);
    await handleCodeDetected(clean);
    setIsSubmittingManual(false);
  };

  const handleTryAgain = () => {
    setScannedResult(null);
    if (mode === "camera") {
      setScanning(true);
      requestScanFrame();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP BAR: Mode Toggle & Close */}
      <div className="flex items-center justify-between z-20 w-full max-w-lg mx-auto">
        {/* Segmented Switch */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.08] border border-white/[0.1] text-xs">
          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "camera"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "manual"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Station Code</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === "camera" && hasTorch && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTorch}
              className={`h-9 w-9 p-0 rounded-xl border-white/[0.1] ${
                torchOn ? "bg-amber-400 text-black" : "bg-white/[0.05] text-zinc-300"
              }`}
            >
              {torchOn ? <Zap className="w-4 h-4 fill-black" /> : <ZapOff className="w-4 h-4" />}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 rounded-xl border-white/[0.1] bg-white/[0.05] text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CENTER WORKSPACE */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl bg-zinc-950/90 border border-white/[0.08] w-full max-w-lg mx-auto">
        {mode === "camera" ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />

            {!scannedResult && (
              <div className="relative z-10 flex flex-col items-center space-y-4 pointer-events-none">
                <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(62,207,142,0.8)]"
                    animate={{ top: ["5%", "95%", "5%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                </div>
                <p className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs font-medium text-white shadow-lg">
                  Point at Kiosk QR on screen
                </p>
              </div>
            )}

            {cameraError && (
              <div className="relative z-20 max-w-xs p-6 text-center space-y-3 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-500/30">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                <p className="text-xs text-red-200">{cameraError}</p>
                <Button
                  size="sm"
                  onClick={() => setMode("manual")}
                  className="bg-primary hover:bg-primary-deep text-black text-xs font-bold h-9 rounded-xl w-full"
                >
                  Type Station Code Instead
                </Button>
              </div>
            )}
          </>
        ) : (
          /* MANUAL CODE ENTRY VIEW */
          <div className="relative z-10 p-6 sm:p-8 w-full max-w-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-lg">
              <Keyboard className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Enter Station Code
              </h3>
              <p className="text-xs text-zinc-400">
                Look at the kiosk screen for the 6-character code (e.g. K-4829 or slug).
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
              <Input
                autoFocus
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. K-4829 or MAIN-ENTRANCE"
                className="h-12 text-center font-mono text-base tracking-widest uppercase rounded-xl bg-black/50 border-white/[0.15] focus:border-primary text-white"
              />

              <Button
                type="submit"
                disabled={isSubmittingManual || !manualCode.trim()}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl gap-2 shadow-lg"
              >
                <span>Confirm Check-In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}

        {/* RESULT OVERLAY */}
        <AnimatePresence>
          {scannedResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-5"
            >
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
                  scannedResult.success
                    ? scannedResult.duplicate
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                    : "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                }`}
              >
                {scannedResult.success ? (
                  scannedResult.duplicate ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    scannedResult.success
                      ? scannedResult.duplicate
                        ? "text-amber-400"
                        : "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {scannedResult.success
                    ? scannedResult.duplicate
                      ? "Cooldown Debounce"
                      : scannedResult.mode === "exit"
                      ? "Departure Confirmed"
                      : "Access Granted"
                    : scannedResult.expired
                    ? "Membership Expired"
                    : "Access Denied"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white max-w-sm">
                  {scannedResult.message}
                </h3>
                {scannedResult.athleteName && (
                  <p className="text-xs text-zinc-400">
                    Athlete: <strong className="text-white">{scannedResult.athleteName}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 w-full max-w-xs">
                {scannedResult.success ? (
                  <Button
                    onClick={onClose}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl gap-2 shadow-lg"
                  >
                    <span>Done & Enjoy Workout</span>
                    <Dumbbell className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleTryAgain}
                      className="flex-1 h-10 border-white/[0.1] text-xs text-zinc-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Try Again
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 h-10 bg-white/[0.08] hover:bg-white/[0.15] text-xs text-white"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="text-center z-20 w-full max-w-lg mx-auto">
        <p className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>GymERP Smart Turnstile Verification</span>
        </p>
      </div>
    </div>
  );
}
