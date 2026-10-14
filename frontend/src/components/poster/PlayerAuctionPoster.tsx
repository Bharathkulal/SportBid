"use client";

import React, { useRef, useState } from "react";
import { Download, Maximize2, Minimize2, Trophy, Phone, MapPin, User, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerAuctionPosterProps {
  playerName: string;
  serialStr: string;
  village?: string;
  role?: string;
  phone?: string;
  sport?: string;
  tournamentTitle?: string;
  photoUrl?: string;
  posterUrl?: string; // High-res backend PNG url
  fullScreenMode?: boolean;
  onToggleFullScreen?: () => void;
  showActions?: boolean;
  // Live Auction Presentation HUD props
  currentBid?: number;
  highestBidderName?: string | null;
  basePrice?: number;
  secondsRemaining?: number;
  auctionStatus?: string;
  overlayChildren?: React.ReactNode;
}

export function PlayerAuctionPoster({
  playerName,
  serialStr,
  village = "KOKARNE",
  role = "BLOCKER",
  phone = "+91 9876543210",
  sport = "VOLLEYBALL",
  tournamentTitle = "CHANDIKAMBA TROPHY 2026",
  photoUrl,
  posterUrl,
  fullScreenMode = false,
  onToggleFullScreen,
  showActions = true,
  currentBid,
  highestBidderName,
  basePrice,
  secondsRemaining,
  auctionStatus,
  overlayChildren,
}: PlayerAuctionPosterProps) {
  const [downloading, setDownloading] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Trigger download of the high-res generated PNG
  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (posterUrl) {
        // If relative URL to backend storage, point to backend host
        const fullUrl = posterUrl.startsWith("http")
          ? posterUrl
          : `http://localhost:8000${posterUrl}`;

        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${serialStr || "01"}_${(playerName || "player").replace(/\s+/g, "_")}_poster.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert("Poster is rendering. Please try again in a moment.");
      }
    } catch (e) {
      console.error("Download error", e);
      // Fallback: direct window open
      if (posterUrl) {
        window.open(posterUrl, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${fullScreenMode ? "w-full h-full justify-center p-4" : "w-full max-w-4xl mx-auto"}`}>
      {/* 16:9 Auction Slide Container */}
      <div
        ref={slideRef}
        className={`w-full aspect-video bg-[#070a12] text-white rounded-2xl relative overflow-hidden select-none shadow-2xl flex flex-col justify-between border-4 border-yellow-400 p-5 sm:p-8 md:p-10 ${
          fullScreenMode ? "max-h-[92vh] max-w-[170vh]" : ""
        }`}
        style={{
          boxShadow: "0 0 30px rgba(250, 204, 21, 0.18), inset 0 0 15px rgba(250, 204, 21, 0.1)",
        }}
      >
        {/* Subtle background sport mesh texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: "radial-gradient(#facc15 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* High-Tech Corner Brackets */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-white pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-white pointer-events-none" />

        {/* Live Auction Presentation HUD (Overlaid for Projectors and Live Bidding) */}
        {currentBid !== undefined && (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-6 bg-black/85 backdrop-blur-md border-2 border-yellow-400 rounded-xl px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-2xl flex items-center gap-3 sm:gap-5 z-20">
            <div>
              <span className="text-[8px] sm:text-[10px] font-black text-yellow-400 uppercase tracking-widest block">
                CURRENT BID
              </span>
              <span className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-400 font-mono leading-none">
                ₹{currentBid.toLocaleString()}
              </span>
              {highestBidderName ? (
                <span className="text-[9px] sm:text-[11px] text-white block mt-0.5 font-bold truncate max-w-[140px] sm:max-w-[200px]">
                  Leader: <span className="text-yellow-300">{highestBidderName}</span>
                </span>
              ) : (
                <span className="text-[9px] sm:text-[11px] text-slate-400 block mt-0.5 font-medium">
                  Base: ₹{(basePrice || 1000).toLocaleString()}
                </span>
              )}
            </div>

            {secondsRemaining !== undefined && secondsRemaining > 0 && (
              <div className="border-l border-yellow-400/40 pl-2.5 sm:pl-4 text-center">
                <span className="text-[8px] sm:text-[10px] font-black text-red-400 uppercase tracking-widest block">
                  TIMER
                </span>
                <span className="text-base sm:text-xl md:text-2xl font-black text-red-400 font-mono animate-pulse">
                  {secondsRemaining}s
                </span>
              </div>
            )}
          </div>
        )}

        {overlayChildren}

        {/* Inner Content Grid: Left (Photo) & Right (Player Info) */}
        <div className="flex-1 grid grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-center min-h-0">
          {/* LEFT SIDE: Large Player Photograph Frame (5 cols) */}
          <div className="col-span-5 h-full flex flex-col justify-center">
            <div className="w-full h-[90%] rounded-xl sm:rounded-2xl border-2 sm:border-4 border-yellow-400 bg-slate-900/90 overflow-hidden relative shadow-lg flex items-center justify-center group">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={playerName}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-yellow-400/80 bg-slate-800 flex items-center justify-center mb-2">
                    <User className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    Athlete Photo
                  </span>
                </div>
              )}

              {/* Sport Badge Pill */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#070a12]/90 border border-yellow-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg">
                <span className="text-[8px] sm:text-[11px] font-black uppercase text-yellow-400 tracking-wider">
                  {sport} PLAYER
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Player Details (7 cols) */}
          <div className="col-span-7 flex flex-col justify-between h-[90%] pl-1 sm:pl-2">
            {/* Player Name */}
            <div>
              <h2 className="text-xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight text-yellow-400 truncate drop-shadow-sm">
                {playerName || "PLAYER NAME"}
              </h2>
              <div className="w-full h-0.5 sm:h-1 bg-yellow-400 mt-1 sm:mt-2 shadow-xs" />
            </div>

            {/* Serial Number (Prominent Highlight) */}
            <div className="mt-2 sm:mt-3">
              <span className="text-[9px] sm:text-xs md:text-sm font-bold uppercase text-yellow-400 tracking-wider">
                SERIAL NUMBER
              </span>
              <div className="mt-0.5 sm:mt-1 inline-block">
                <div className="border-2 sm:border-3 border-yellow-400 bg-slate-950/90 rounded-lg sm:rounded-xl px-4 py-0.5 sm:px-6 sm:py-1 shadow-md">
                  <span className="text-2xl sm:text-4xl md:text-6xl font-black text-white font-mono leading-none">
                    {serialStr || "01"}
                  </span>
                </div>
              </div>
            </div>

            {/* Village / Place */}
            <div className="mt-1 sm:mt-2">
              <span className="text-[8px] sm:text-xs font-bold uppercase text-yellow-400 tracking-wider block">
                VILLAGE
              </span>
              <span className="text-sm sm:text-xl md:text-3xl font-black text-white uppercase tracking-wide truncate block">
                {village || "KOKARNE"}
              </span>
            </div>

            {/* Playing Role */}
            <div className="mt-1 sm:mt-2">
              <span className="text-[8px] sm:text-xs font-bold uppercase text-yellow-400 tracking-wider block">
                ROLE
              </span>
              <span className="text-sm sm:text-xl md:text-3xl font-black text-white uppercase tracking-wide truncate block">
                {role || "BLOCKER"}
              </span>
            </div>

            {/* Phone */}
            <div className="mt-1 sm:mt-2">
              <span className="text-[8px] sm:text-xs font-bold uppercase text-yellow-400 tracking-wider block">
                PHONE
              </span>
              <span className="text-xs sm:text-lg md:text-2xl font-bold text-white font-mono tracking-wide truncate block">
                {phone || "+91 XXXXXXXXXX"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-2 sm:pt-3 border-t-2 border-yellow-400 text-center shrink-0">
          <p className="text-[9px] sm:text-xs md:text-base font-black text-yellow-400 uppercase tracking-wider sm:tracking-widest flex items-center justify-center gap-2">
            <span>{tournamentTitle}</span>
            <span>•</span>
            <span>{sport} PLAYER AUCTION</span>
          </p>
        </div>
      </div>

      {/* Action Bar (Download & Full Screen Toggle) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black shadow-md px-5 text-xs sm:text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Preparing PNG..." : "Download Match Poster (PNG)"}
          </Button>

          {onToggleFullScreen && (
            <Button
              variant="outline"
              onClick={onToggleFullScreen}
              className="border-slate-700 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm"
            >
              {fullScreenMode ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2 text-yellow-400" />
                  Exit Full Screen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2 text-yellow-400" />
                  Projector / Full Screen Mode
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
