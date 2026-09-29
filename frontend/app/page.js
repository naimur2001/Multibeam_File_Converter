"use client";

import { useEffect, useRef, useState } from "react";
import { createJob, getJob, getDownloadUrl } from "../lib/api";

const STAGES = [
  { key: "received", label: "File received" },
  { key: "validating", label: "Validating .all file" },
  // { key: "preprocessing", label: "Preprocessing sonar data" },
  { key: "extracting", label: "Extracting depth points" },
  { key: "converting", label: "Converting to LAS" },
  { key: "completed", label: "Completed" },
];

const STAGE_LABELS = Object.fromEntries(STAGES.map((s) => [s.key, s.label]));
STAGE_LABELS.failed = "Failed";

// Simple hardcoded coordinates for the sonar fan (No Math!)
const BEAMS = [
  { i: 0, x2: 20, y2: 160 },
  { i: 1, x2: 35, y2: 180 },
  { i: 2, x2: 50, y2: 198 },
  { i: 3, x2: 65, y2: 214 },
  { i: 4, x2: 80, y2: 228 },
  { i: 5, x2: 95, y2: 240 },
  { i: 6, x2: 110, y2: 250 },
  { i: 7, x2: 125, y2: 258 },
  { i: 8, x2: 140, y2: 265 },
  { i: 9, x2: 155, y2: 270 },
  { i: 10, x2: 170, y2: 274 },
  { i: 11, x2: 185, y2: 277 },
  { i: 12, x2: 200, y2: 278 },
  { i: 13, x2: 215, y2: 277 },
  { i: 14, x2: 230, y2: 274 },
  { i: 15, x2: 245, y2: 270 },
  { i: 16, x2: 260, y2: 265 },
  { i: 17, x2: 275, y2: 258 },
  { i: 18, x2: 290, y2: 250 },
  { i: 19, x2: 305, y2: 240 },
  { i: 20, x2: 320, y2: 228 },
  { i: 21, x2: 335, y2: 214 },
  { i: 22, x2: 350, y2: 198 },
  { i: 23, x2: 365, y2: 180 },
  { i: 24, x2: 380, y2: 160 },
];

// Simple hardcoded background contour lines (No Math!)
const CONTOURS = [
  "M-5,20 C25,12 45,30 70,18 S100,24 110,16",
  "M-5,29 C25,21 45,39 70,27 S100,33 110,25",
  "M-5,38 C25,30 45,48 70,36 S100,42 110,34",
  "M-5,47 C25,39 45,57 70,45 S100,51 110,43",
  "M-5,56 C25,48 45,66 70,54 S100,60 110,52",
  "M-5,65 C25,57 45,75 70,63 S100,69 110,61",
  "M-5,74 C25,66 45,84 70,72 S100,78 110,70",
  "M-5,83 C25,75 45,93 70,81 S100,87 110,79",
  "M-5,92 C25,84 45,102 70,90 S100,96 110,88",
];

const SEABED = "M0,232 C40,246 80,212 130,236 S220,276 270,248 S350,218 400,244 L400,320 L0,320 Z";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

.mb-root {
  --abyss: #05202E;
  --trench: #0B3346;
  --shelf: #134A60;
  --foam: #7FE0D1;
  --sand: #EFE4CB;
  --silt: #8FA9B4;
  --coral: #FF8A70;
  font-family: 'Figtree', system-ui, sans-serif;
  background:
    radial-gradient(1200px 600px at 80% -10%, #0E4058 0%, transparent 60%),
    var(--abyss);
  color: var(--sand);
}
.mb-display { font-family: 'Bricolage Grotesque', 'Figtree', sans-serif; letter-spacing: -0.02em; }
.mb-num { font-variant-numeric: tabular-nums; }
.mb-contours { opacity: .09; }

.mb-drop:focus-visible,/ .mb-btn:focus-visible {
  outline: 2px solid var(--foam);
  outline-offset: 4px;
}

.mb-stage-dot { transition: background-color .3s ease, box-shadow .3s ease; }
.mb-stage-active .mb-stage-dot { box-shadow: 0 0 0 6px rgba(127,224,209,.18); }
`;

function SonarFan({ state }) {
  const beamColor = state === "error" ? "var(--coral)" : "var(--foam)";
  const beamOpacity = state === "drag" ? 0.8 : 0.35;

  return (
    <svg viewBox="0 0 400 320" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="mb-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4E285" />
          <stop offset="35%" stopColor="#5CC2A8" />
          <stop offset="70%" stopColor="#2A6F97" />
          <stop offset="100%" stopColor="#1B2A5C" />
        </linearGradient>
      </defs>

      {/* Static Beams */}
      {BEAMS.map((b) => (
        <line
          key={b.i}
          x1={200}
          y1={44}
          x2={b.x2}
          y2={b.y2}
          stroke={beamColor}
          strokeOpacity={beamOpacity}
          strokeWidth="1.2"
        />
      ))}

      {/* Seabed */}
      <path
        d={SEABED}
        fill={state === "done" ? "url(#mb-depth)" : "var(--trench)"}
      />
      <path
        d={SEABED.split(" L")[0]}
        fill="none"
        stroke={state === "error" ? "var(--coral)" : "var(--foam)"}
        strokeOpacity=".6"
        strokeWidth="1.5"
      />

      {/* Vessel */}
      <g transform="translate(166, 18)">
        <path d="M0 18 L68 18 L58 30 L10 30 Z" fill="var(--sand)" />
        <rect x="22" y="6" width="22" height="12" rx="2" fill="var(--sand)" />
        <rect x="30" y="0" width="4" height="6" fill="var(--sand)" />
      </g>
      
      {/* Water line */}
      <line x1="0" y1="48" x2="400" y2="48" stroke="var(--silt)" strokeOpacity=".35" strokeDasharray="3 5" />
    </svg>
  );
}

function StageTrack({ current, failed }) {
  const idx = STAGES.findIndex((s) => s.key === current);

  return (
    <ol className="space-y-0">
      {STAGES.map((s, i) => {
        const done = idx > i || current === "completed";
        const active = idx === i && current !== "completed";
        const broke = failed && active;

        return (
          <li
            key={s.key}
            className={`relative flex items-center gap-4 py-2.5 ${active ? "mb-stage-active" : ""}`}
          >
            {i < STAGES.length - 1 && (
              <span
                className="absolute left-[7px] top-[26px] h-[calc(100%-14px)] w-px"
                style={{ background: done ? "var(--foam)" : "rgba(143,169,180,.25)" }}
              />
            )}
            <span
              className="mb-stage-dot relative z-10 h-[15px] w-[15px] shrink-0 rounded-full border"
              style={{
                borderColor: broke ? "var(--coral)" : done || active ? "var(--foam)" : "rgba(143,169,180,.4)",
                backgroundColor: broke ? "var(--coral)" : done ? "var(--foam)" : "transparent",
              }}
            />
            <span
              className="text-[15px]"
              style={{
                color: broke ? "var(--coral)" : done || active ? "var(--sand)" : "var(--silt)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [lastStage, setLastStage] = useState(null);

  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const isProcessing = phase === "uploading" || phase === "polling";

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const startPolling = (jobId) => {
    stopPolling();

    const pollOnce = async () => {
      try {
        const data = await getJob(jobId);

        setJob(data);
        if (STAGE_LABELS[data.stage] && data.stage !== "failed") {
          setLastStage(data.stage);
        }

        if (data.status === "completed") {
          stopPolling();
          setPhase("completed");
        }

        if (data.status === "failed") {
          stopPolling();
          setPhase("error");
          setError(
            data.message ||
              data.error ||
              "Conversion failed. Try another .all file."
          );
        }
      } catch (err) {
        stopPolling();
        setPhase("error");
        setError(err.message);
      }
    };

    pollOnce();
    pollRef.current = setInterval(pollOnce, 2000);
  };

  const handleFile = (selectedFile) => {
    setError("");
    setJob(null);
    setLastStage(null);

    if (!selectedFile) return;

    const isValidExtension = selectedFile.name.toLowerCase().endsWith(".all");

    if (!isValidExtension) {
      setPhase("error");
      setError(`"${selectedFile.name}" isn't a .all file. Choose a Kongsberg .all file to continue.`);
      setFile(null);
      return;
    }

    setPhase("idle");
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setError("");
    setJob(null);
    setPhase("uploading");

    try {
      const response = await createJob(file);

      const initialJob = {
        id: response.jobId,
        status: response.status,
        stage: response.stage,
        message: response.message,
      };

      setJob(initialJob);
      setLastStage(response.stage);
      setPhase("polling");

      startPolling(response.jobId);
    } catch (err) {
      setPhase("error");
      setError(err.message);
    }
  };

  const reset = () => {
    stopPolling();
    setFile(null);
    setJob(null);
    setError("");
    setLastStage(null);
    setPhase("idle");
  };

  const openFilePicker = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const fanState = dragActive
    ? "drag"
    : isProcessing
    ? "processing"
    : phase === "completed"
    ? "done"
    : phase === "error"
    ? "error"
    : file
    ? "armed"
    : "idle";

  const summary = job?.summary;

  return (
    <main className="mb-root min-h-screen relative overflow-hidden">
      <style>{styles}</style>

      {/* Faint bathymetric contour backdrop */}
      <svg className="mb-contours pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        {CONTOURS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#EFE4CB" strokeWidth=".15" />
        ))}
      </svg>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-20">
        {/* Left: story + pipeline */}
        <section>
          <h1 className="mb-display text-[44px] leading-[1.02] font-extrabold sm:text-[60px]">
            Sonar pings in.
            <br />
            Point clouds out.
            <br/>
            Naimur Rahman.
          </h1>

          <p className="mt-5 max-w-md text-[17px] leading-relaxed" style={{ color: "var(--silt)" }}>
            Drop a Kongsberg .all multibeam file and get a LAS point cloud. Built By NAIMUR RAHMAN.
          </p>

          <div className="mt-10 max-w-sm rounded-2xl p-6" style={{ background: "rgba(11,51,70,.6)", border: "1px solid rgba(127,224,209,.15)" }}>
            <h2 className="mb-display text-lg font-bold">Conversion pipeline</h2>
            <div className="mt-4">
              <StageTrack current={phase === "completed" ? "completed" : lastStage} failed={phase === "error" && !!job} />
            </div>
          </div>
        </section>

        {/* Right: the sonar drop zone */}
        <section>
          <input
            ref={inputRef}
            type="file"
            accept=".all"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a .all file to convert"
            onClick={openFilePicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isProcessing) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              if (!isProcessing) handleFile(event.dataTransfer.files?.[0]);
            }}
            className={`mb-drop relative overflow-hidden rounded-[28px] transition-transform duration-300 ${
              isProcessing ? "cursor-progress" : "cursor-pointer"
            } ${dragActive ? "scale-[1.015]" : ""}`}
            style={{
              background: "linear-gradient(180deg, #0A2C3D 0%, #0B3346 100%)",
              border: `1.5px ${dragActive ? "solid" : "dashed"} ${
                phase === "error" ? "var(--coral)" : dragActive ? "var(--foam)" : "rgba(127,224,209,.35)"
              }`,
            }}
          >
            <div className="px-4 pt-4">
              <SonarFan state={fanState} />
            </div>

            <div className="px-7 pb-7 -mt-2">
              {file ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-display text-xl font-bold break-all">{file.name}</p>
                    <p className="mt-1 text-sm mb-num" style={{ color: "var(--silt)" }}>
                      {formatSize(file.size)}
                      {!isProcessing && phase !== "completed" && " · click to swap file"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-display text-xl font-bold">
                    {dragActive ? "Release to drop your survey" : "Drop your .all file here"}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--silt)" }}>
                    or click to browse your files
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {phase !== "completed" && (
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="cursor-pointer mb-btn mb-display mt-5 w-full rounded-2xl px-6 py-4 text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-40 hover:brightness-110"
              style={{ background: "var(--foam)", color: "var(--abyss)" }}
            >
              {phase === "uploading"
                ? "Uploading…"
                : phase === "polling"
                ? `${STAGE_LABELS[job?.stage] || "Processing"}…`
                : "Convert to LAS"}
            </button>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl p-4 text-[15px]"
              style={{ background: "rgba(255,138,112,.1)", border: "1px solid rgba(255,138,112,.4)", color: "var(--coral)" }}
            >
              {error}
            </div>
          )}

          {job?.message && phase !== "error" && (
            <p className="mt-4 text-sm" style={{ color: "var(--silt)" }}>
              {job.message}
            </p>
          )}

          {/* Result */}
          {phase === "completed" && job && (
            <div className="mt-5 rounded-[28px] p-7" style={{ background: "var(--sand)", color: "var(--abyss)" }}>
              <p className="mb-display text-2xl font-extrabold">Your LAS file is ready</p>

              {summary?.pointCount > 0 && (
                <div className="mt-5">
                  <p className="mb-num mb-display text-4xl font-bold">
                    {summary.pointCount.toLocaleString()}
                    <span className="ml-2 text-base font-medium opacity-70">depth points</span>
                  </p>

                  <div className="mt-5">
                    <div
                      className="h-3 rounded-full"
                      style={{ background: "linear-gradient(90deg, #F4E285, #5CC2A8, #2A6F97, #1B2A5C)" }}
                    />
                    <div className="mt-2 flex justify-between text-sm mb-num">
                      <span>Shallowest {summary.minDepth?.toFixed(1)} m</span>
                      <span>Deepest {summary.maxDepth?.toFixed(1)} m</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={getDownloadUrl(job.id)}
                  className="mb-btn mb-display inline-block rounded-2xl px-6 py-3.5 font-bold transition hover:brightness-125"
                  style={{ background: "var(--abyss)", color: "var(--sand)" }}
                >
                  Download LAS file
                </a>
                <button
                  onClick={reset}
                  className="mb-btn rounded-2xl px-5 py-3.5 font-semibold underline-offset-4 hover:underline"
                >
                  Convert another file
                </button>
              </div>

              <p className="mt-5 text-xs break-all opacity-60">Job {job.id}</p>
            </div>
          )}

          {job && phase !== "completed" && (
            <p className="mt-3 text-xs break-all" style={{ color: "var(--silt)", opacity: 0.7 }}>
              Job {job.id}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}