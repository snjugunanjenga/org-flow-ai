import { useEffect, useRef, useCallback } from "react";

interface GraphNode {
  id: string;
  type: string;
  label: string;
  connections: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  sourceType: string;
  targetType: string;
}

interface ForceGraphProps {
  nodes: { type: string; label: string; connections: number }[];
  edges: { id: string; source_type: string; source_label: string; target_type: string; target_label: string; relationship: string }[];
  typeColors: Record<string, string>;
  onNodeClick?: (node: { type: string; label: string; connections: number }) => void;
}

const TYPE_HSL: Record<string, string> = {
  person: "250, 80%, 65%",
  topic: "170, 70%, 50%",
  decision: "40, 90%, 60%",
  project: "280, 70%, 65%",
  meeting: "200, 80%, 60%",
};

export function ForceGraph({ nodes, edges, onNodeClick }: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const graphNodesRef = useRef<GraphNode[]>([]);
  const graphEdgesRef = useRef<GraphEdge[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const scaleRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.parentElement?.clientWidth || 800;
    const h = 500;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const cx = w / 2;
    const cy = h / 2;

    // Build graph nodes
    const gNodes: GraphNode[] = nodes.map((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.35;
      return {
        id: `${n.type}:${n.label}`,
        type: n.type,
        label: n.label,
        connections: n.connections,
        x: cx + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
        y: cy + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5),
        vx: 0,
        vy: 0,
        targetX: cx + Math.cos(angle) * radius * 0.7,
        targetY: cy + Math.sin(angle) * radius * 0.7,
      };
    });

    const gEdges: GraphEdge[] = edges.map((e) => ({
      id: e.id,
      sourceId: `${e.source_type}:${e.source_label}`,
      targetId: `${e.target_type}:${e.target_label}`,
      relationship: e.relationship,
      sourceType: e.source_type,
      targetType: e.target_type,
    }));

    graphNodesRef.current = gNodes;
    graphEdgesRef.current = gEdges;

    const nodeMap = new Map(gNodes.map((n) => [n.id, n]));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const simulate = () => {
      frame++;
      const damping = 0.92;
      const repulsion = 1200;
      const attraction = 0.005;
      const centerGravity = 0.01;

      for (let i = 0; i < gNodes.length; i++) {
        const a = gNodes[i];
        // Repulsion
        for (let j = i + 1; j < gNodes.length; j++) {
          const b = gNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
        // Center gravity
        a.vx += (cx - a.x) * centerGravity;
        a.vy += (cy - a.y) * centerGravity;
      }

      // Attraction along edges
      for (const e of gEdges) {
        const s = nodeMap.get(e.sourceId);
        const t = nodeMap.get(e.targetId);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = dist * attraction;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      }

      for (const n of gNodes) {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }
    };

    const draw = () => {
      const dpr = window.devicePixelRatio;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const ox = offsetRef.current.x;
      const oy = offsetRef.current.y;
      const scale = scaleRef.current;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      // Draw edges as bezier curves
      for (const e of gEdges) {
        const s = nodeMap.get(e.sourceId);
        const t = nodeMap.get(e.targetId);
        if (!s || !t) continue;

        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const perpX = -dy * 0.15;
        const perpY = dx * 0.15;
        const cpX = midX + perpX;
        const cpY = midY + perpY;

        const hsl = TYPE_HSL[e.sourceType] || "220, 10%, 55%";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(cpX, cpY, t.x, t.y);
        ctx.strokeStyle = `hsla(${hsl}, 0.25)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrowhead
        const arrowT = 0.75;
        const ax = (1 - arrowT) * (1 - arrowT) * s.x + 2 * (1 - arrowT) * arrowT * cpX + arrowT * arrowT * t.x;
        const ay = (1 - arrowT) * (1 - arrowT) * s.y + 2 * (1 - arrowT) * arrowT * cpY + arrowT * arrowT * t.y;
        const tdx = 2 * (1 - arrowT) * (cpX - s.x) + 2 * arrowT * (t.x - cpX);
        const tdy = 2 * (1 - arrowT) * (cpY - s.y) + 2 * arrowT * (t.y - cpY);
        const angle = Math.atan2(tdy, tdx);
        const arrowSize = 6;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - arrowSize * Math.cos(angle - 0.4), ay - arrowSize * Math.sin(angle - 0.4));
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - arrowSize * Math.cos(angle + 0.4), ay - arrowSize * Math.sin(angle + 0.4));
        ctx.strokeStyle = `hsla(${hsl}, 0.4)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of gNodes) {
        const hsl = TYPE_HSL[n.type] || "220, 10%, 55%";
        const r = Math.max(6, Math.min(20, 4 + n.connections * 2));
        const isHovered = hoveredRef.current === n.id;

        // Glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        grad.addColorStop(0, `hsla(${hsl}, ${isHovered ? 0.5 : 0.2})`);
        grad.addColorStop(1, `hsla(${hsl}, 0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hsl}, ${isHovered ? 1 : 0.8})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${hsl}, 0.5)`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label
        if (isHovered || n.connections > 3 || gNodes.length < 30) {
          ctx.font = `${isHovered ? "bold " : ""}11px Inter, sans-serif`;
          ctx.fillStyle = `hsla(${hsl}, 0.9)`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y - r - 6);
        }
      }

      // Tooltip for hovered node
      if (hoveredRef.current) {
        const hn = nodeMap.get(hoveredRef.current);
        if (hn) {
          const text = `${hn.type.toUpperCase()} · ${hn.connections} connections`;
          ctx.font = "10px Inter, sans-serif";
          const tw = ctx.measureText(text).width + 16;
          const tx = hn.x - tw / 2;
          const ty = hn.y + Math.max(6, Math.min(20, 4 + hn.connections * 2)) + 12;
          ctx.fillStyle = "hsla(225, 20%, 9%, 0.85)";
          ctx.beginPath();
          ctx.roundRect(tx, ty, tw, 22, 4);
          ctx.fill();
          ctx.fillStyle = "hsla(210, 20%, 85%, 0.9)";
          ctx.textAlign = "center";
          ctx.fillText(text, hn.x, ty + 15);
        }
      }

      ctx.restore();
    };

    const loop = () => {
      if (frame < 300) simulate();
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    // Mouse interaction
    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = scaleRef.current;
      return {
        x: (e.clientX - rect.left - offsetRef.current.x) / scale,
        y: (e.clientY - rect.top - offsetRef.current.y) / scale,
      };
    };

    const findNode = (mx: number, my: number) => {
      for (const n of gNodes) {
        const r = Math.max(6, Math.min(20, 4 + n.connections * 2));
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < (r + 4) * (r + 4)) return n;
      }
      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        offsetRef.current.x = draggingRef.current.ox + (e.clientX - draggingRef.current.startX);
        offsetRef.current.y = draggingRef.current.oy + (e.clientY - draggingRef.current.startY);
        return;
      }
      const pos = getMousePos(e);
      const node = findNode(pos.x, pos.y);
      hoveredRef.current = node?.id || null;
      canvas.style.cursor = node ? "pointer" : "grab";
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      const node = findNode(pos.x, pos.y);
      if (!node) {
        draggingRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
        canvas.style.cursor = "grabbing";
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingRef.current) {
        draggingRef.current = null;
        canvas.style.cursor = "grab";
        return;
      }
      const pos = getMousePos(e);
      const node = findNode(pos.x, pos.y);
      if (node && onNodeClick) {
        onNodeClick({ type: node.type, label: node.label, connections: node.connections });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scaleRef.current = Math.max(0.3, Math.min(3, scaleRef.current * delta));
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    const handleResize = () => {
      const nw = canvas.parentElement?.clientWidth || 800;
      canvas.width = nw * window.devicePixelRatio;
      canvas.style.width = `${nw}px`;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div className="glass-panel overflow-hidden rounded-xl">
      <canvas ref={canvasRef} className="w-full" style={{ height: 500 }} />
    </div>
  );
}
