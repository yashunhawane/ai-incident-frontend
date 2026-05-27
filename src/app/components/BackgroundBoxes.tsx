"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BackgroundBoxesProps {
  /** Background color shown through gaps */
  backgroundColor?: string;
  /** Box fill color (default/idle) */
  boxColor?: string;
  /** Border color of each box */
  borderColor?: string;
  /** Border width in px */
  borderWidth?: number;
  /** Size of each box in px */
  boxSize?: number;
  /** Hover color palette — random one is picked per box */
  colors?: string[];
  /** Transition duration INTO hover color (ms) */
  timeIn?: number;
  /** Transition duration OUT of hover color (ms) */
  timeOut?: number;
  /** X-axis rotation in degrees for depth effect */
  rotateX?: number;
  /** Y-axis rotation in degrees for depth effect */
  rotateY?: number;
  /** Z-axis rotation in degrees */
  rotateZ?: number;
  /** Extra scale to fill container on strong rotations */
  fillGrid?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function BackgroundBoxes({
  backgroundColor = "#0a0a0a",
  boxColor = "transparent",
  borderColor = "rgba(255,255,255,0.07)",
  borderWidth = 1,
  boxSize = 48,
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22d3ee", "#a3e635"],
  timeIn = 120,
  timeOut = 600,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  fillGrid = 1,
  className = "",
  style,
}: BackgroundBoxesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });

  // Recalculate grid on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calculate = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Add extra rows/cols to cover container when rotated
      const extra = Math.ceil(fillGrid * 2) + 4;
      setBoxes({
        cols: Math.ceil(w / boxSize) + extra,
        rows: Math.ceil(h / boxSize) + extra,
      });
    };

    calculate();
    const ro = new ResizeObserver(calculate);
    ro.observe(el);
    return () => ro.disconnect();
  }, [boxSize, fillGrid]);

  const pickColor = useCallback(
    () => colors[Math.floor(Math.random() * colors.length)],
    [colors]
  );

  const totalBoxes = boxes.rows * boxes.cols;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
        ...style,
      }}
    >
      {/* Rotation wrapper — centred so rotation is symmetrical */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${fillGrid})`,
          transformStyle: "preserve-3d",
          width: `${boxes.cols * boxSize}px`,
          height: `${boxes.rows * boxSize}px`,
          display: "grid",
          gridTemplateColumns: `repeat(${boxes.cols}, ${boxSize}px)`,
          gridTemplateRows: `repeat(${boxes.rows}, ${boxSize}px)`,
        }}
      >
        {Array.from({ length: totalBoxes }).map((_, i) => (
          <Box
            key={i}
            size={boxSize}
            idleColor={boxColor}
            borderColor={borderColor}
            borderWidth={borderWidth}
            timeIn={timeIn}
            timeOut={timeOut}
            pickColor={pickColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Individual Box ───────────────────────────────────────────────────────────

interface BoxProps {
  size: number;
  idleColor: string;
  borderColor: string;
  borderWidth: number;
  timeIn: number;
  timeOut: number;
  pickColor: () => string;
}

function Box({ size, idleColor, borderColor, borderWidth, timeIn, timeOut, pickColor }: BoxProps) {
  const [bg, setBg] = useState(idleColor);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBg(pickColor());
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => setBg(idleColor), 0);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        border: `${borderWidth}px solid ${borderColor}`,
        boxSizing: "border-box",
        transition: bg === idleColor
          ? `background-color ${timeOut}ms ease`
          : `background-color ${timeIn}ms ease`,
        cursor: "default",
      }}
    />
  );
}