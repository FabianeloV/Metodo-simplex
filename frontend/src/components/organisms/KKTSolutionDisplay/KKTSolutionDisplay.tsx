import React, { useState } from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import type { KKTCase, KKTCaseStatus, KKTResponse } from "../../../types/kkt";
import styles from "./KKTSolutionDisplay.module.css";

interface KKTSolutionDisplayProps {
  result: KKTResponse | null;
  loading: boolean;
  error: string | null;
}

function fmt(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return "—";
  const r = Number(n.toPrecision(digits));
  return String(r);
}

const STATUS_META: Record<KKTCaseStatus, { label: string; cls: string }> = {
  valid:              { label: "Válido",                cls: "valid" },
  dual_infeasible:    { label: "Infactible (dual)",      cls: "warn" },
  primal_infeasible:  { label: "Infactible (primal)",    cls: "warn" },
  no_convergence:     { label: "Sin convergencia",       cls: "gray" },
};

function CaseStatusBadge({ status }: { status: KKTCaseStatus }) {
  const m = STATUS_META[status];
  return <span className={[styles.caseBadge, styles[m.cls]].join(" ")}>{m.label}</span>;
}

function CaseRow({
  kase, variables, constraintsStr, isOptimal, open, onToggle,
}: {
  kase: KKTCase;
  variables: string[];
  constraintsStr: string[];
  isOptimal: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const activeLabel = kase.active_indices.length
    ? kase.active_indices.map((i) => `g${i + 1}`).join(", ")
    : "ninguna";

  return (
    <div className={styles.caseBlock}>
      <button
        className={[styles.caseHeader, open ? styles.caseHeaderOpen : ""].join(" ")}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={styles.caseId}>Caso {kase.case_id}</span>
        <span className={styles.activeChip}>activas: {activeLabel}</span>
        <CaseStatusBadge status={kase.status} />
        {isOptimal && <Badge color="green">★ Óptimo</Badge>}
        {kase.objective_value !== null && (
          <span className={styles.objVal}>f = {fmt(kase.objective_value)}</span>
        )}
        <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.caseBody}>
          {kase.point && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Punto:</span>
              <span className={styles.chipGroup}>
                {kase.point.map((v, i) => (
                  <span key={variables[i]} className={styles.chipPoint}>
                    {variables[i]} = {fmt(v)}
                  </span>
                ))}
              </span>
            </div>
          )}
          {kase.lambdas && Object.keys(kase.lambdas).length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Multiplicadores λ:</span>
              <span className={styles.chipGroup}>
                {Object.entries(kase.lambdas).map(([k, v]) => (
                  <span key={k} className={styles.chipLambda}>{k} = {fmt(v)}</span>
                ))}
              </span>
            </div>
          )}
          {kase.mus && Object.keys(kase.mus).length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Multiplicadores μ:</span>
              <span className={styles.chipGroup}>
                {Object.entries(kase.mus).map(([k, v]) => (
                  <span key={k} className={styles.chipMu}>{k} = {fmt(v)}</span>
                ))}
              </span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Restricciones:</span>
            <span className={styles.chipGroup}>
              {constraintsStr.map((c, i) => (
                <span
                  key={i}
                  className={kase.active_indices.includes(i) ? styles.chipActive : styles.chipInactive}
                >
                  g{i + 1}: {c}
                </span>
              ))}
            </span>
          </div>
          <p className={styles.note}>{kase.note}</p>
        </div>
      )}
    </div>
  );
}

export const KKTSolutionDisplay: React.FC<KKTSolutionDisplayProps> = ({
  result,
  loading,
  error,
}) => {
  const [openCases, setOpenCases] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setOpenCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Analizando restricciones activas…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const isOptimal = result.status === "optimal";
  const sortedCases = [...result.cases].sort((a, b) => {
    if (a.case_id === result.optimal_case_id) return -1;
    if (b.case_id === result.optimal_case_id) return 1;
    if ((a.status === "valid") !== (b.status === "valid")) {
      return a.status === "valid" ? -1 : 1;
    }
    return a.case_id - b.case_id;
  });

  return (
    <section className={styles.card} aria-labelledby="kkt-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="kkt-result-heading" className={styles.cardTitle}>
            {isOptimal ? "Solución: Punto Óptimo KKT Encontrado" : "Sin Punto que Satisfaga KKT"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {isOptimal
          ? <Badge color="green">✓ Óptimo</Badge>
          : <Badge color="red">Infactible</Badge>}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f({result.variables.join(", ")})</span>
          <code className={styles.expr}>{result.function_str}</code>
        </div>
      </div>

      {isOptimal && result.optimal_point && result.optimal_value !== null && (
        <div className={styles.metrics}>
          {result.optimal_point.map((val, idx) => (
            <MetricCard key={result.variables[idx]} label={`${result.variables[idx]}*`} value={fmt(val)} highlight />
          ))}
          <MetricCard label="f(x*)" value={fmt(result.optimal_value)} highlight />
          <MetricCard label="Casos explorados" value={String(result.cases_explored)} />
        </div>
      )}

      {!isOptimal && <ErrorBanner message={result.message} />}

      <div className={styles.tableSection}>
        <p className={styles.sectionLabel}>Casos analizados (combinaciones de restricciones activas)</p>
        <div className={styles.caseList}>
          {sortedCases.map((c) => (
            <CaseRow
              key={c.case_id}
              kase={c}
              variables={result.variables}
              constraintsStr={result.constraints_str}
              isOptimal={c.case_id === result.optimal_case_id}
              open={openCases.has(c.case_id)}
              onToggle={() => toggle(c.case_id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
