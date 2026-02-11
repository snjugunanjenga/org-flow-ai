import { useRef, useEffect, useState, useCallback } from "react";

interface GraphEdge {
  id: string;
  source_type: string;
  source_label: string;
  target_type: string;
  target_label: string;
  relationship: string;
  weight: number;
}

interface TreeNode {
  key: string;
  type: string;
  label: string;
  children: TreeNode[];
  x: number;
  y: number;
  collapsed: boolean;
  connections: number;
}

interface Props {
  edges: GraphEdge[];
  typeColors: Record<string, string>;
  onNodeClick?: (node: { type: string; label: string; connections: number }) => void;
}

const TYPE_FILL: Record<string, string> = {
  person: "hsl(250, 80%, 65%)",
  topic: "hsl(170, 70%, 50%)",
  decision: "hsl(40, 90%, 60%)",
  project: "hsl(280, 70%, 65%)",
  meeting: "hsl(200, 80%, 60%)",
};

const NODE_HEIGHT = 36;
const NODE_PADDING_X = 16;
const LEVEL_GAP = 200;
const SIBLING_GAP = 12;

function buildTree(edges: GraphEdge[]): TreeNode[] {
  const nodesMap = new Map<string, { type: string; label: string; children: Set<string>; parents: Set<string> }>();

  edges.forEach((e) => {
    const sKey = `${e.source_type}:${e.source_label}`;
    const tKey = `${e.target_type}:${e.target_label}`;
    if (!nodesMap.has(sKey)) nodesMap.set(sKey, { type: e.source_type, label: e.source_label, children: new Set(), parents: new Set() });
    if (!nodesMap.has(tKey)) nodesMap.set(tKey, { type: e.target_type, label: e.target_label, children: new Set(), parents: new Set() });
    nodesMap.get(sKey)!.children.add(tKey);
    nodesMap.get(tKey)!.parents.add(sKey);
  });

  // Root nodes: nodes with no parents, or if none, nodes with most children
  let roots = Array.from(nodesMap.entries()).filter(([, v]) => v.parents.size === 0);
  if (roots.length === 0) {
    roots = Array.from(nodesMap.entries()).sort((a, b) => b[1].children.size - a[1].children.size).slice(0, 3);
  }

  const visited = new Set<string>();
  function buildNode(key: string, depth: number): TreeNode | null {
    if (visited.has(key) || depth > 4) return null;
    visited.add(key);
    const info = nodesMap.get(key);
    if (!info) return null;
    const children: TreeNode[] = [];
    info.children.forEach((ck) => {
      const child = buildNode(ck, depth + 1);
      if (child) children.push(child);
    });
    return {
      key,
      type: info.type,
      label: info.label,
      children,
      x: 0,
      y: 0,
      collapsed: depth >= 2,
      connections: info.children.size + info.parents.size,
    };
  }

  return roots.map(([k]) => buildNode(k, 0)).filter(Boolean) as TreeNode[];
}

function layoutTree(roots: TreeNode[], startX: number, startY: number) {
  let currentY = startY;

  function layout(node: TreeNode, depth: number) {
    node.x = startX + depth * LEVEL_GAP;
    if (node.collapsed || node.children.length === 0) {
      node.y = currentY;
      currentY += NODE_HEIGHT + SIBLING_GAP;
    } else {
      const firstChildY = currentY;
      node.children.forEach((c) => layout(c, depth + 1));
      const lastChildY = node.children[node.children.length - 1].y;
      node.y = (firstChildY + lastChildY) / 2;
    }
  }

  roots.forEach((r) => layout(r, 0));
  return currentY;
}

function measureText(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width;
}

export function MindMapCanvas({ edges, typeColors, onNodeClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [trees, setTrees] = useState<TreeNode[]>([]);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState<{ nodeKey: string } | { pan: true; startX: number; startY: number; origOffsetX: number; origOffsetY: number } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  // Flatten all nodes for hit testing
  const allNodes = useRef<TreeNode[]>([]);

  const flattenNodes = useCallback((roots: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    function walk(n: TreeNode) {
      result.push(n);
      if (!n.collapsed) n.children.forEach(walk);
    }
    roots.forEach(walk);
    return result;
  }, []);

  useEffect(() => {
    const t = buildTree(edges);
    layoutTree(t, 0, 0);
    setTrees([...t]);
  }, [edges]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setDimensions({ w: e.contentRect.width, h: Math.max(e.contentRect.height, 500) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);

    const flat = flattenNodes(trees);
    allNodes.current = flat;

    ctx.font = "500 13px 'Space Grotesk', 'Inter', sans-serif";

    // Draw edges
    flat.forEach((node) => {
      if (node.collapsed) return;
      node.children.forEach((child) => {
        if (!flat.includes(child)) return;
        const sx = node.x + offset.x + measureText(ctx, node.label) + NODE_PADDING_X * 2 + 20;
        const sy = node.y + offset.y + NODE_HEIGHT / 2;
        const tx = child.x + offset.x;
        const ty = child.y + offset.y + NODE_HEIGHT / 2;
        const cpx = (sx + tx) / 2;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cpx, sy, cpx, ty, tx, ty);
        ctx.strokeStyle = "hsla(220, 15%, 40%, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

    // Draw nodes
    flat.forEach((node) => {
      const x = node.x + offset.x;
      const y = node.y + offset.y;
      const textW = measureText(ctx, node.label);
      const boxW = textW + NODE_PADDING_X * 2;
      const isHovered = hoveredKey === node.key;
      const fill = TYPE_FILL[node.type] || "hsl(220, 15%, 40%)";

      // Node box
      ctx.beginPath();
      const r = 8;
      ctx.roundRect(x, y, boxW, NODE_HEIGHT, r);
      ctx.fillStyle = isHovered ? fill : `hsla(225, 20%, 14%, 0.8)`;
      ctx.fill();
      ctx.strokeStyle = fill;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = isHovered ? "white" : "hsl(210, 20%, 88%)";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, x + NODE_PADDING_X, y + NODE_HEIGHT / 2);

      // Expand/collapse indicator
      if (node.children.length > 0) {
        const ix = x + boxW + 6;
        const iy = y + NODE_HEIGHT / 2;
        ctx.beginPath();
        ctx.arc(ix, iy, 10, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(225, 15%, 20%, 0.8)";
        ctx.fill();
        ctx.strokeStyle = fill;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "hsl(210, 20%, 75%)";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.collapsed ? ">" : "<", ix, iy + 1);
        ctx.textAlign = "start";
        ctx.font = "500 13px 'Space Grotesk', 'Inter', sans-serif";
      }

      // Type dot
      ctx.beginPath();
      ctx.arc(x + 8, y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    });
  }, [trees, offset, hoveredKey, dimensions, flattenNodes]);

  const hitTest = useCallback(
    (mx: number, my: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.font = "500 13px 'Space Grotesk', 'Inter', sans-serif";

      for (const node of allNodes.current) {
        const x = node.x + offset.x;
        const y = node.y + offset.y;
        const textW = measureText(ctx, node.label);
        const boxW = textW + NODE_PADDING_X * 2 + (node.children.length > 0 ? 26 : 0);
        if (mx >= x && mx <= x + boxW && my >= y && my <= y + NODE_HEIGHT) {
          return node;
        }
      }
      return null;
    },
    [offset]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(mx, my);
    if (hit) {
      setDragging({ nodeKey: hit.key });
    } else {
      setDragging({ pan: true, startX: e.clientX, startY: e.clientY, origOffsetX: offset.x, origOffsetY: offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging && "pan" in dragging) {
      setOffset({
        x: dragging.origOffsetX + (e.clientX - dragging.startX),
        y: dragging.origOffsetY + (e.clientY - dragging.startY),
      });
    } else if (dragging && "nodeKey" in dragging) {
      const node = allNodes.current.find((n) => n.key === dragging.nodeKey);
      if (node) {
        node.x = mx - offset.x;
        node.y = my - offset.y - NODE_HEIGHT / 2;
        setTrees([...trees]);
      }
    } else {
      const hit = hitTest(mx, my);
      setHoveredKey(hit?.key || null);
    }
  };

  const handleMouseUp = () => setDragging(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(mx, my);
    if (!hit) return;

    // Check if clicked on expand/collapse button
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.font = "500 13px 'Space Grotesk', 'Inter', sans-serif";
      const textW = measureText(ctx, hit.label);
      const boxW = textW + NODE_PADDING_X * 2;
      const ix = hit.x + offset.x + boxW + 6;
      const iy = hit.y + offset.y + NODE_HEIGHT / 2;
      const dist = Math.sqrt((mx - ix) ** 2 + (my - iy) ** 2);
      if (hit.children.length > 0 && dist < 12) {
        hit.collapsed = !hit.collapsed;
        layoutTree(trees, 0, 0);
        setTrees([...trees]);
        return;
      }
    }

    onNodeClick?.({ type: hit.type, label: hit.label, connections: hit.connections });
  };

  return (
    <div ref={containerRef} className="glass-panel overflow-hidden" style={{ height: 420 }}>
      <canvas
        ref={canvasRef}
        width={dimensions.w}
        height={dimensions.h}
        style={{ width: dimensions.w, height: dimensions.h, cursor: dragging ? "grabbing" : hoveredKey ? "pointer" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}
