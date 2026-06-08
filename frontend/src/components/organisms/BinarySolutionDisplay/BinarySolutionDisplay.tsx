import React, { useState } from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import { BBTreeGraph } from "../../molecules/BBTreeGraph";
import type { TreeNodeData } from "../../molecules/BBTreeGraph";
import type { BBNode, BinaryResponse } from "../../../types/binary";
import type { VariableCount } from "../../../types/simplex";
import styles from "./BinarySolutionDisplay.module.css";

interface BinarySolutionDisplayProps {
  nVars: VariableCount;
  result: BinaryResponse | null;
  loading: boolean;
  error: string | null;
}

const VAR_LABELS = ["x₁", "x₂", "x₃", "x₄"];

function fmtVal(n: number): string {
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/\.?0+$/, "");
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  branched:          { label: "Ramificado",         cls: "branched" },
  pruned_bound:      { label: "Podado (cota)",       cls: "prunedBound" },
  pruned_infeasible: { label: "Podado (infactible)", cls: "prunedInfeasible" },
  integer:           { label: "Solución entera",     cls: "integer" },
};

function NodeStatusBadge({ status }: { status: string }) {
  const info = STATUS_LABEL[status] ?? { label: status, cls: "branched" };
  return <span className={[styles.nodeBadge, styles[info.cls]].join(" ")}>{info.label}</span>;
}

function NodeRow({ node, isOpen, onToggle }: {
  node: BBNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fixedEntries = Object.entries(node.fixed_vars);

  return (
    <div className={styles.nodeBlock}>
      <button
        className={[styles.nodeHeader, isOpen ? styles.nodeHeaderOpen : ""].join(" ")}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.nodeId}>Nodo {node.node_id}</span>
        <span className={styles.nodeDepth}>Prof. {node.depth}</span>
        {node.branched_on && (
          <span className={styles.branchChip}>rama: {node.branched_on}</span>
        )}
        <NodeStatusBadge status={node.status} />
        {node.lp_value !== null && (
          <span className={styles.lpVal}>Z_LP = {fmtVal(node.lp_value)}</span>
        )}
        <span className={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={styles.nodeBody}>
          {fixedEntries.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Variables fijas:</span>
              <span className={styles.chipGroup}>
                {fixedEntries.map(([k, v]) => (
                  <span key={k} className={v === 1 ? styles.chipOne : styles.chipZero}>
                    {k} = {v}
                  </span>
                ))}
              </span>
            </div>
          )}

          {node.lp_vars && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Relajación LP:</span>
              <span className={styles.chipGroup}>
                {Object.entries(node.lp_vars).map(([k, v]) => (
                  <span key={k} className={styles.chipLp}>
                    {k} = {fmtVal(v)}
                  </span>
                ))}
              </span>
            </div>
          )}

          {node.status === "pruned_infeasible" && (
            <p className={styles.infeasNote}>La relajación LP de este nodo es infactible.</p>
          )}
          {node.status === "pruned_bound" && (
            <p className={styles.boundNote}>
              La cota LP ({node.lp_value !== null ? fmtVal(node.lp_value) : "—"}) no mejora
              la mejor solución entera conocida.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function toBinaryTree(nodes: BBNode[]): TreeNodeData[] {
  return nodes.map(n => {
    const fixedStr = Object.entries(n.fixed_vars)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return {
      id: n.node_id,
      parentId: n.parent_id,
      depth: n.depth,
      status: n.status,
      lpValue: n.lp_value,
      detail: fixedStr || "raíz",
      edgeLabel: n.edge_label,
    };
  });
}

export const BinarySolutionDisplay: React.FC<BinarySolutionDisplayProps> = ({
  nVars,
  result,
  loading,
  error,
}) => {
  const [openNodes, setOpenNodes] = useState<Set<number>>(new Set());

  const toggleNode = (id: number) => {
    setOpenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Resolviendo con Branch &amp; Bound…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const isOptimal = result.status === "optimal";

  return (
    <section className={styles.card} aria-labelledby="bin-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="bin-result-heading" className={styles.cardTitle}>
            {isOptimal ? "Solución: Óptimo Entero Encontrado" : `Solución: ${result.status}`}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {isOptimal
          ? <Badge color="green">✓ Óptimo</Badge>
          : <Badge color="red">Sin solución</Badge>}
      </div>

      {isOptimal && result.variables && result.objective_value !== null && (
        <div className={styles.metrics}>
          <MetricCard label="Objetivo (Z)" value={fmtVal(result.objective_value!)} highlight />
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

      {!isOptimal && <ErrorBanner message={result.message} />}

      {result.nodes.length > 0 && (
        <div className={styles.treeSection}>
          <p className={styles.sectionLabel}>Árbol de Branch &amp; Bound</p>
          <BBTreeGraph nodes={toBinaryTree(result.nodes)} />
          <p className={styles.sectionLabel} style={{ marginTop: "1.2rem" }}>
            Detalle de nodos
          </p>
          <div className={styles.nodeList}>
            {result.nodes.map((node) => (
              <NodeRow
                key={node.node_id}
                node={node}
                isOpen={openNodes.has(node.node_id)}
                onToggle={() => toggleNode(node.node_id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
