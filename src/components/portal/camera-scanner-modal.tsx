"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  Zap,
  ZapOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { memberSelfScanKioskAction } from "@/lib/api/attendance";
import { playSuccessChime, playDeniedBuzz } from "@/lib/kiosk/audio";
import jsQR from "jsqr";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess?: (data: any) => void;
}

export function CameraScannerModal({ open, onClose, onScanSuccess }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    success: boolean;
    message: string;
    mode?: string;
    athleteName?: string;
  } | null>(null);

  // Start Camera Stream
  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannedResult(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open]);

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
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS safari
        await videoRef.current.play();
      }

      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));

      setHasCamera(true);
      setScanning(true);
      requestScanFrame();
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasCamera(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings to scan."
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
    } catch {
      // Torch toggle failed
    }
  };

  const requestScanFrame = () => {
    animFrameRef.current = requestAnimationFrame(scanTick);
  };

  const scanTick = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (open) requestScanFrame();
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      if (open) requestScanFrame();
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
      // Found QR code!
      handleQrFound(code.data);
      return;
    }

    if (open) {
      requestScanFrame();
    }
  };

  const handleQrFound = async (rawCode: string) => {
    setScanning(false);

    try {
      const res: any = await memberSelfScanKioskAction({ qrToken: rawCode });
      if (res.success) {
        playSuccessChime();
        setScannedResult({
          success: true,
          message: res.message || "Check-In Verified!",
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
          message: res.message || "Check-In could not be recorded",
        });
      }
    } catch (err: any) {
      playDeniedBuzz();
      setScannedResult({
        success: false,
        message: err.message || "Network error occurred",
      });
    }
  };

  const handleScanAgain = () => {
    setScannedResult(null);
    setScanning(true);
    requestScanFrame();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Hidden Canvas for QR frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Controls */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Kiosk Scanner</h2>
            <p className="text-[11px] text-zinc-400">Point at gym display QR</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
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

      {/* Viewfinder Center Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl bg-zinc-950 border border-white/[0.08]">
        {/* Video stream element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Viewfinder Target Frame (when active) */}
        {!scannedResult && (
          <div className="relative z-10 flex flex-col items-center space-y-4 pointer-events-none">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              {/* Animated laser scanning line */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(62,207,142,0.8)]"
                animate={{
                  top: ["5%", "95%", "5%"],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
            </div>

            <p className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs font-medium text-white shadow-lg">
              Align kiosk QR inside target
            </p>
          </div>
        )}

        {/* Error State */}
        {cameraError && (
          <div className="relative z-20 max-w-xs p-6 text-center space-y-3 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-500/30">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-xs text-red-200">{cameraError}</p>
            <Button
              size="sm"
              onClick={startCamera}
              className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 rounded-lg"
            >
              Retry Camera
            </Button>
          </div>
        )}

        {/* Result Overlay Card */}
        <AnimatePresence>
          {scannedResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-30 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-5"
            >
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
                  scannedResult.success
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_40px_rgba(62,207,142,0.3)]"
                    : "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                }`}
              >
                {scannedResult.success ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    scannedResult.success ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {scannedResult.success
                    ? scannedResult.mode === "exit"
                      ? "Departure Logged"
                      : "Check-In Verified"
                    : "Scan Failed"}
                </span>
                <h3 className="text-2xl font-black text-white">{scannedResult.message}</h3>
                {scannedResult.athleteName && (
                  <p className="text-xs text-zinc-400">
                    Welcome, <strong className="text-white">{scannedResult.athleteName}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 w-full max-w-xs">
                {scannedResult.success ? (
                  <Button
                    onClick={onClose}
                    className="w-full h-11 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-sm rounded-xl gap-2 shadow-[0_0_20px_rgba(62,207,142,0.3)]"
                  >
                    <span>Done & Enjoy Workout</span>
                    <Dumbbell className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleScanAgain}
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

      {/* Footer Info */}
      <div className="text-center z-20">
        <p className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>GymERP Instant Camera Verification</span>
        </p>
      </div>
    </div>
  );
}
