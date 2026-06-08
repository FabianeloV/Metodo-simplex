import React, { useMemo } from "react";
import styles from "./BBTreeGraph.module.css";

export interface TreeNodeData {
  id: number;
  parentId: number | null;
  depth: number;
  status: string;
  lpValue: number | null;
  detail: string;
  edgeLabel: string | null;
}

const NODE_W = 82;
const NODE_H = 52;
const UNIT_W = 96;
const LEVEL_H = 92;
const PAD_X = 24;
const PAD_Y = 28;
const MAX_DISPLAY = 120;

const STATUS_STYLE: Record<string, { fill: string; stroke: string }> = {
  branched:          { fill: "#4338CA", stroke: "#3730A3" },
  pruned_bound:      { fill: "#B45309", stroke: "#92400E" },
  pruned_infeasible: { fill: "#B91C1C", stroke: "#991B1B" },
  integer:           { fill: "#047857", stroke: "#065F46" },
};

const LEGEND = [
  { key: "branched",          label: "Ramificado",         color: "#4338CA" },
  { key: "pruned_bound",      label: "Podado (cota)",       color: "#B45309" },
  { key: "pruned_infeasible", label: "Podado (infactible)", color: "#B91C1C" },
  { key: "integer",           label: "Solución entera",     color: "#047857" },
];

function fmtLp(v: number | null): string {
  if (v === null) return "infact.";
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? `Z=${r}` : `Z=${r.toFixed(2)}`;
}

function useLayout(nodes: TreeNodeData[]) {
  return useMemo(() => {
    if (nodes.length === 0) return { positions: new Map<number, { x: number; y: number }>(), svgW: 0, svgH: 0 };

    const children = new Map<number, number[]>();
    for (const n of nodes) {
      if (!children.has(n.id)) children.set(n.id, []);
      if (n.parentId !== null) {
        if (!children.has(n.parentId)) children.set(n.parentId, []);
        children.get(n.parentId)!.push(n.id);
      }
    }

    const subtreeW = new Map<number, number>();
    function computeW(id: number): number {
      const kids = children.get(id) ?? [];
      if (kids.length === 0) { subtreeW.set(id, 1); return 1; }
      const total = kids.reduce((s, k) => s + computeW(k), 0);
      subtreeW.set(id, total);
      return total;
    }

    const positions = new Map<number, { x: number; y: number }>();
    function assign(id: number, depth: number, xOff: number): void {
      const w = subtreeW.get(id) ?? 1;
      positions.set(id, { x: xOff + w / 2, y: depth });
      let cx = xOff;
      for (const kid of (children.get(id) ?? [])) {
        const kw = subtreeW.get(kid) ?? 1;
        assign(kid, depth + 1, cx);
        cx += kw;
      }
    }

    const root = nodes.find(n => n.parentId === null);
    if (!root) return { positions: new Map<number, { x: number; y: number }>(), svgW: 0, svgH: 0 };

    computeW(root.id);
    assign(root.id, 0, 0);

    const xs = [...positions.values()].map(p => p.x);
    const ys = [...positions.values()].map(p => p.y);
    const svgW = (Math.max(...xs) + 0.5) * UNIT_W + PAD_X * 2;
    const svgH = (Math.max(...ys)) * LEVEL_H + NODE_H + PAD_Y * 2;

    return { positions, svgW, svgH };
  }, [nodes]);
}

interface BBTreeGraphProps {
  nodes: TreeNodeData[];
  title?: string;
}

export const BBTreeGraph: React.FC<BBTreeGraphProps> = ({ nodes, title }) => {
  const truncated = nodes.length > MAX_DISPLAY;
  const visible = truncated ? nodes.slice(0, MAX_DISPLAY) : nodes;

  // Filter out nodes whose parent was truncated so we don't get orphan edges
  const visibleIds = new Set(visible.map(n => n.id));
  const displayNodes = visible.filter(n => n.parentId === null || visibleIds.has(n.parentId));

  const { positions, svgW, svgH } = useLayout(displayNodes);

  if (displayNodes.length === 0) return null;

  const nodeX = (id: number) => PAD_X + (positions.get(id)?.x ?? 0) * UNIT_W;
  const nodeY = (id: number) => PAD_Y + (positions.get(id)?.y ?? 0) * LEVEL_H;

  return (
    <div>
      {title && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "ui-monospace,monospace", margin: "0 0 6px 2px" }}>{title}</p>}
      <div className={styles.container}>
        <svg
          width={Math.max(svgW, 200)}
          height={Math.max(svgH, 100)}
          className={styles.svg}
          aria-label="Árbol Branch & Bound"
        >
          {/* Edges */}
          {displayNodes
            .filter(n => n.parentId !== null && visibleIds.has(n.parentId))
            .map(n => {
              const px = nodeX(n.parentId!);
              const py = nodeY(n.parentId!) + NODE_H;
              const cx = nodeX(n.id);
              const cy = nodeY(n.id);
              const mx = (px + cx) / 2;
              const my = (py + cy) / 2;
              const path = `M ${px} ${py} C ${px} ${(py + cy) / 2}, ${cx} ${(py + cy) / 2}, ${cx} ${cy}`;
              return (
                <g key={`e-${n.id}`}>
                  <path d={path} className={styles.edge} />
                  {n.edgeLabel && (
                    <>
                      <rect
                        x={mx - 22}
                        y={my - 8}
                        width={44}
                        height={14}
                        rx={3}
                        className={styles.edgeLabelBg}
                        opacity={0.85}
                      />
                      <text x={mx} y={my} className={styles.edgeLabel}>
                        {n.edgeLabel}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

          {/* Nodes */}
          {displayNodes.map(n => {
            const sx = nodeX(n.id) - NODE_W / 2;
            const sy = nodeY(n.id);
            const centerX = nodeX(n.id);
            const style = STATUS_STYLE[n.status] ?? STATUS_STYLE.branched;
            return (
              <g key={`n-${n.id}`} className={styles.nodeGroup}>
                <rect
                  className="nodeRect"
                  x={sx} y={sy}
                  width={NODE_W} height={NODE_H}
                  rx={7} ry={7}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.5}
                />
                <text x={centerX} y={sy + 13} className={styles.nodeId}>
                  N{n.id}
                </text>
                <text x={centerX} y={sy + 28} className={styles.nodeVal}>
                  {fmtLp(n.lpValue)}
                </text>
                <text x={centerX} y={sy + 44} className={styles.nodeDetail}>
                  {n.detail.length > 13 ? n.detail.slice(0, 12) + "…" : n.detail}
                </text>
                <title>
                  {`Nodo ${n.id} | ${n.status}\nLP: ${n.lpValue ?? "infactible"}\n${n.detail}`}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.legend}>
        {LEGEND.map(l => (
          <span key={l.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {truncated && (
        <p className={styles.maxNote}>
          Mostrando los primeros {MAX_DISPLAY} de {nodes.length} nodos explorados.
        </p>
      )}
    </div>
  );
};
