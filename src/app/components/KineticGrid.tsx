"use client";

import { useEffect, useRef, useState } from "react";

interface KineticGridProps {
  clickInteraction?: boolean;
  clickProps?: { clickForce?: number; motionSpeed?: number };
  cursorTrail?: boolean;
  cursorTrailProps?: { trailMode?: "hover" | "click"; trailLength?: number; trailColor?: string };
  backgroundColor?: string;
  gridColor?: string;
  dotColor?: string;
  hoverColor?: string;
  gridSize?: number;
  repulsionStrength?: number;
  radius?: number;
  dotSize?: number;
  gridThickness?: number;
  baseOpacity?: number;
  style?: React.CSSProperties;
}

export default function KineticGrid(props: KineticGridProps) {
  const {
    clickInteraction = false,
    clickProps = {},
    cursorTrail = false,
    cursorTrailProps = {},
    backgroundColor = "transparent",
    gridColor = "#FFFFFF",
    dotColor = "#FFFFFF",
    hoverColor = "#FFFFFF",
    gridSize = 60,
    repulsionStrength = -0.65,
    radius = 290,
    dotSize = 1.5,
    gridThickness = 0.5,
    baseOpacity = 0.09,
  } = props;

  const { clickForce = 0, motionSpeed = 1 } = clickProps;
  const { trailMode = "hover", trailLength = 0.1, trailColor = "#FFFFFF" } = cursorTrailProps;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dotsRef = useRef(new Map());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const trailPointsRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const isMouseDownRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const colorsRef = useRef({
    backgroundColor, gridColor, dotColor, hoverColor, gridSize,
    repulsionStrength, radius, dotSize, gridThickness, baseOpacity,
    clickInteraction, clickForce, motionSpeed, cursorTrail,
    trailMode, trailLength, trailColor,
  });

  const prevGridSizeRef = useRef(gridSize);

  useEffect(() => {
    const gridSizeChanged = prevGridSizeRef.current !== gridSize;
    prevGridSizeRef.current = gridSize;
    colorsRef.current = {
      backgroundColor, gridColor, dotColor, hoverColor, gridSize,
      repulsionStrength, radius, dotSize, gridThickness, baseOpacity,
      clickInteraction, clickForce, motionSpeed, cursorTrail,
      trailMode, trailLength, trailColor,
    };
    if (gridSizeChanged && mounted && canvasRef.current) {
      const canvas = canvasRef.current;
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      dotsRef.current.clear();
      for (let gx = -gridSize; gx < width + gridSize * 2; gx += gridSize)
        for (let gy = -gridSize; gy < height + gridSize * 2; gy += gridSize)
          dotsRef.current.set(`${gx},${gy}`, { x: gx, y: gy, vx: 0, vy: 0, size: 1, targetSize: 1, brightness: 1 });
    }
  }, [mounted, backgroundColor, gridColor, dotColor, hoverColor, gridSize, repulsionStrength, radius, dotSize, gridThickness, baseOpacity, clickInteraction, clickForce, motionSpeed, cursorTrail, trailMode, trailLength, trailColor]);

  const parseColor = (color: string) => {
    if (!color || color === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    const rgba = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/i);
    if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: rgba[4] !== undefined ? +rgba[4] : 1 };
    let hex = color.replace("#", "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16), a: 1 };
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxDist = 400;
    const getCanvasSize = () => ({ width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 });

    const initDots = () => {
      dotsRef.current.clear();
      const { width, height } = getCanvasSize();
      const gs = colorsRef.current.gridSize;
      for (let gx = -gs; gx < width + gs * 2; gx += gs)
        for (let gy = -gs; gy < height + gs * 2; gy += gs)
          dotsRef.current.set(`${gx},${gy}`, { x: gx, y: gy, vx: 0, vy: 0, size: 1, targetSize: 1, brightness: 1 });
    };

    let { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;
    initDots();

    let lastTime = performance.now();

    const getHoverIntensity = (x: number, y: number) => {
      const mouse = mousePosRef.current;
      if (!mouse) return 0;
      const r = colorsRef.current.radius;
      const dx = x - mouse.x, dy = y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      return dist > r ? 0 : Math.pow(1 - dist / r, 3.5);
    };

    const mapRepulsion = (v: number) => v <= 0 ? v * 25 : v * 90;

    const getCursorPush = (bx: number, by: number) => {
      const mouse = mousePosRef.current;
      const rep = mapRepulsion(colorsRef.current.repulsionStrength);
      if (!mouse || rep === 0) return { x: 0, y: 0 };
      const dx = bx - mouse.x, dy = by - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) return { x: 0, y: 0 };
      const push = Math.pow(1 - Math.min(dist/maxDist, 1), 2) * rep;
      return { x: dx/dist*push, y: dy/dist*push };
    };

    const getClickPush = (bx: number, by: number) => {
      if (!colorsRef.current.clickInteraction || !isMouseDownRef.current) return { x: 0, y: 0 };
      const mouse = mousePosRef.current;
      const force = colorsRef.current.clickForce;
      if (!mouse || force <= 0) return { x: 0, y: 0 };
      const dx = bx - mouse.x, dy = by - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) return { x: 0, y: 0 };
      const push = Math.pow(1 - Math.min(dist/maxDist, 1), 2) * force * 100;
      return { x: dx/dist*push, y: dy/dist*push };
    };

    const animate = () => {
      const now = performance.now();
      lastTime = now;
      const c = colorsRef.current;
      const hC = parseColor(c.hoverColor), gC = parseColor(c.gridColor);
      const dC = parseColor(c.dotColor), bC = parseColor(c.backgroundColor);
      const speed = Math.max(0, Math.min(1, c.motionSpeed));
      const springStiffness = 0.02 + speed * 0.06;
      const damping = 0.7 + speed * 0.05;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${bC.r},${bC.g},${bC.b},${bC.a})`;
      ctx.fillRect(0, 0, width, height);

      dotsRef.current.forEach((dot, key) => {
        const [gxStr, gyStr] = key.split(",");
        const gx = +gxStr, gy = +gyStr;
        const right = dotsRef.current.get(`${gx + c.gridSize},${gy}`);
        const bottom = dotsRef.current.get(`${gx},${gy + c.gridSize}`);
        const hi = getHoverIntensity(dot.x, dot.y);

        const drawLine = (a: any, b: any) => {
          const avg = (hi + getHoverIntensity(b.x, b.y)) / 2;
          const r = Math.round(gC.r + (hC.r - gC.r) * avg);
          const g = Math.round(gC.g + (hC.g - gC.g) * avg);
          const bl = Math.round(gC.b + (hC.b - gC.b) * avg);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.lineWidth = c.gridThickness + avg * 2;
          ctx.strokeStyle = `rgba(${r},${g},${bl},${c.baseOpacity + (1 - c.baseOpacity) * avg})`;
          ctx.stroke();
        };

        if (right) drawLine(dot, right);
        if (bottom) drawLine(dot, bottom);
      });

      dotsRef.current.forEach((dot, key) => {
        const [gxStr, gyStr] = key.split(",");
        const gx = +gxStr, gy = +gyStr;
        const cp = getCursorPush(gx, gy), ck = getClickPush(gx, gy);
        const tx = gx + cp.x + ck.x, ty = gy + cp.y + ck.y;
        dot.vx = (dot.vx + (tx - dot.x) * springStiffness) * damping;
        dot.vy = (dot.vy + (ty - dot.y) * springStiffness) * damping;
        dot.x += dot.vx; dot.y += dot.vy;
        const hi = getHoverIntensity(dot.x, dot.y);
        dot.targetSize = c.dotSize + hi * c.dotSize;
        dot.size += (dot.targetSize - dot.size) * 0.15;
        const r = Math.round(dC.r + (hC.r - dC.r) * hi);
        const g = Math.round(dC.g + (hC.g - dC.g) * hi);
        const bl = Math.round(dC.b + (hC.b - dC.b) * hi);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(c.dotSize * 0.5, dot.size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${bl},${c.baseOpacity + (1 - c.baseOpacity) * hi})`;
        ctx.fill();
      });

      if (c.cursorTrail) {
        const trail = trailPointsRef.current;
        const effectiveLen = Math.max(1, Math.round(c.trailLength * 50));
        const maxAge = Math.max(200, effectiveLen * 40);
        if (trail.length > 1) {
          ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 2;
          ctx.beginPath();
          let started = false;
          for (const pt of trail) {
            if (now - pt.time < maxAge) {
              if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
              else ctx.lineTo(pt.x, pt.y);
            }
          }
          const age = trail.length > 0 ? Math.max(0, 1 - (now - trail[trail.length-1].time) / maxAge) : 0;
          const tc = parseColor(c.trailColor);
          ctx.strokeStyle = `rgba(${tc.r},${tc.g},${tc.b},${age * 0.9 * tc.a})`;
          ctx.stroke(); ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.clientWidth / rect.width);
      const y = (e.clientY - rect.top) * (canvas.clientHeight / rect.height);
      if (x >= 0 && y >= 0 && x <= canvas.clientWidth && y <= canvas.clientHeight) {
        mousePosRef.current = { x, y };
        const { cursorTrail: ct, trailMode: tm, trailLength: tlen } = colorsRef.current;
        const effLen = Math.max(1, Math.round(tlen * 100));
        if (ct && effLen > 0 && (tm === "hover" || isMouseDownRef.current)) {
          const trail = trailPointsRef.current;
          trail.push({ x, y, time: performance.now() });
          if (trail.length > effLen) trail.splice(0, trail.length - effLen);
        }
      } else {
        mousePosRef.current = null;
      }
    };

    const handleMouseDown = () => { isMouseDownRef.current = true; };
    const handleMouseUp = () => {
      if (colorsRef.current.trailMode === "click") trailPointsRef.current = [];
      isMouseDownRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    const ro = new ResizeObserver(() => {
      const s = getCanvasSize();
      width = s.width; height = s.height;
      canvas.width = width; canvas.height = height;
      initDots();
    });
    ro.observe(canvas);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      ro.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        ...props.style,
      }}
    />
  );
}