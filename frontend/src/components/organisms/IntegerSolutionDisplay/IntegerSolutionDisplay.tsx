import React, { useState } from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import { BBTreeGraph } from "../../molecules/BBTreeGraph";
import type { TreeNodeData } from "../../molecules/BBTreeGraph";
import type { IntegerNode, IntegerResponse } from "../../../types/integer";
import type { VariableCount } from "../../../types/simplex";
import styles from "./IntegerSolutionDisplay.module.css";

interface Props {
  nVars: VariableCount;
  result: IntegerResponse | null;
  loading: boolean;
  error: string | null;
}

const VAR_LABELS = ["x₁", "x₂", "x₃", "x₄", "x₅"];

function fmt(n: number): string {
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/\.?0+$/, "");
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  branched:          { label: "Ramificado",         cls: "branched" },
  pruned_bound:      { label: "Podado (cota)",       cls: "prunedBound" },
  pruned_infeasible: { label: "Podado (infactible)", cls: "prunedInfeasible" },
  integer:           { label: "Solución entera",     cls: "integer" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, cls: "branched" };
  return <span className={[styles.nodeBadge, styles[m.cls]].join(" ")}>{m.label}</span>;
}

function DirectionChip({ dir }: { dir: string | null }) {
  if (!dir) return null;
  return (
    <span className={dir === "floor" ? styles.chipFloor : styles.chipCeil}>
      {dir === "floor" ? "⌊piso⌋" : "⌈techo⌉"}
    </span>
  );
}

function NodeRow({ node, open, onToggle }: {
  node: IntegerNode;
  open: boolean;
  onToggle: () => void;
}) {
  const lbEntries = Object.entries(node.lower_bounds);
  const ubEntries = Object.entries(node.upper_bounds);

  return (
    <div className={styles.nodeBlock}>
      <button
        className={[styles.nodeHeader, open ? styles.nodeHeaderOpen : ""].join(" ")}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={styles.nodeId}>Nodo {node.node_id}</span>
        <span className={styles.nodeDepth}>Prof. {node.depth}</span>
        <DirectionChip dir={node.branch_direction} />
        {node.branched_on && (
          <span className={styles.branchChip}>rama: {node.branched_on}</span>
        )}
        <StatusBadge status={node.status} />
        {node.lp_value !== null && (
          <span className={styles.lpVal}>Z_LP = {fmt(node.lp_value)}</span>
        )}
        <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.nodeBody}>
          {lbEntries.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cotas inferiores:</span>
              <span className={styles.chipGroup}>
                {lbEntries.map(([k, v]) => (
                  <span key={k} className={styles.chipLb}>{k} ≥ {fmt(v)}</span>
                ))}
              </span>
            </div>
          )}
          {ubEntries.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cotas superiores:</span>
              <span className={styles.chipGroup}>
                {ubEntries.map(([k, v]) => (
                  <span key={k} className={styles.chipUb}>{k} ≤ {fmt(v)}</span>
                ))}
              </span>
            </div>
          )}
          {node.lp_vars && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Relajación LP:</span>
              <span className={styles.chipGroup}>
                {Object.entries(node.lp_vars).map(([k, v]) => (
                  <span key={k} className={styles.chipLp}>{k} = {fmt(v)}</span>
                ))}
              </span>
            </div>
          )}
          {node.status === "pruned_infeasible" && (
            <p className={styles.infeasNote}>La relajación LP de este nodo es infactible.</p>
          )}
          {node.status === "pruned_bound" && (
            <p className={styles.boundNote}>
              Cota LP ({node.lp_value !== null ? fmt(node.lp_value) : "—"}) no mejora
              la mejor solución entera conocida.
            </p>
          )}
          {node.status === "integer" && (
            <p className={styles.integerNote}>
              Todas las variables son enteras. Solución candidata registrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function toIntegerTree(nodes: IntegerNode[]): TreeNodeData[] {
  return nodes.map(n => {
    const lbStr = Object.entries(n.lower_bounds).map(([k, v]) => `${k}≥${v}`).join(",");
    const ubStr = Object.entries(n.upper_bounds).map(([k, v]) => `${k}≤${v}`).join(",");
    const parts = [lbStr, ubStr].filter(Boolean);
    return {
      id: n.node_id,
      parentId: n.parent_id,
      depth: n.depth,
      status: n.status,
      lpValue: n.lp_value,
      detail: parts.length ? parts.join(" ") : "raíz",
      edgeLabel: n.edge_label,
    };
  });
}

export const IntegerSolutionDisplay: React.FC<Props> = ({
  nVars, result, loading, error,
}) => {
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setOpenNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Resolviendo con Branch &amp; Bound entero…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const isOptimal = result.status === "optimal";

  return (
    <section className={styles.card} aria-labelledby="int-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="int-result-heading" className={styles.cardTitle}>
            {isOptimal
              ? "Solución: Óptimo Entero Encontrado"
              : result.status === "limit"
              ? "Solución: Límite de nodos alcanzado"
              : "Solución: Sin solución entera"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {isOptimal
          ? <Badge color="green">✓ Óptimo</Badge>
          : result.status === "limit"
          ? <Badge color="blue">Límite</Badge>
          : <Badge color="red">Sin solución</Badge>}
      </div>

      {(isOptimal || result.status === "limit") && result.variables && result.objective_value !== null && (
        <div className={styles.metrics}>
          <MetricCard label="Objetivo (Z)" value={fmt(result.objective_value!)} highlight />
          {Array.from({ length: nVars }, (_, i) => {
            const key = `x${i + 1}`;
            return (
              <MetricCard
                key={key}
                label={VAR_LABELS[i]}
                value={String(result.variables![key] ?? 0)}
              />
            );
          })}
          <MetricCard label="Nodos explorados" value={String(result.nodes_explored)} />
        </div>
      )}

      {!isOptimal && result.status !== "limit" && (
        <ErrorBanner message={result.message} />
      )}

      {result.nodes.length > 0 && (
        <div className={styles.treeSection}>
          <p className={styles.sectionLabel}>Árbol de Branch &amp; Bound</p>
          <BBTreeGraph nodes={toIntegerTree(result.nodes)} />
          <p className={styles.sectionLabel} style={{ marginTop: "1.2rem" }}>
            Detalle de nodos
          </p>
          <div className={styles.nodeList}>
            {result.nodes.map(node => (
              <NodeRow
                key={node.node_id}
                node={node}
                open={openNodes.has(node.node_id)}
                onToggle={() => toggle(node.node_id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
