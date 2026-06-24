import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import type { GradientResponse } from "../../../types/gradient";
import styles from "./GradientSolutionDisplay.module.css";

interface GradientSolutionDisplayProps {
  result: GradientResponse | null;
  loading: boolean;
  error: string | null;
}

function fmt(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return "—";
  const r = Number(n.toPrecision(digits));
  return Number.isInteger(r) ? String(r) : String(r);
}

function fmtSci(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n !== 0 && Math.abs(n) < 1e-3) return n.toExponential(2);
  return fmt(n);
}

export const GradientSolutionDisplay: React.FC<GradientSolutionDisplayProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Aplicando el método del gradiente…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const { optimal_point, optimal_value, gradient_norm, status, variables } = result;
  const converged = status === "optimal";

  return (
    <section className={styles.card} aria-labelledby="gradient-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="gradient-result-heading" className={styles.cardTitle}>
            {converged ? "Solución: Óptimo Encontrado" : "Sin Convergencia"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {converged ? (
          <Badge color="green">✓ Convergió</Badge>
        ) : (
          <Badge color="red">No convergió</Badge>
        )}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>
            f({variables.join(", ")})
          </span>
          <code className={styles.expr}>{result.function_str}</code>
        </div>
        {result.gradient_str.map((g, idx) => (
          <div className={styles.exprRow} key={idx}>
            <span className={styles.exprLabel}>
              ∂f/∂{variables[idx]}
            </span>
            <code className={styles.expr}>{g}</code>
          </div>
        ))}
      </div>

      {optimal_point !== null && optimal_value !== null && (
        <div className={styles.metrics}>
          {optimal_point.map((val, idx) => (
            <MetricCard
              key={variables[idx]}
              label={`${variables[idx]}*`}
              value={fmt(val)}
              highlight
            />
          ))}
          <MetricCard label="f(x*)" value={fmt(optimal_value)} highlight />
          <MetricCard label="‖∇f‖" value={gradient_norm !== null ? fmtSci(gradient_norm) : "—"} />
          <MetricCard label="Iteraciones" value={String(result.iterations_count)} />
        </div>
      )}

      {result.iterations.length > 0 && (
        <div className={styles.tableSection}>
          <p className={styles.sectionLabel}>Tabla de iteraciones</p>
          <div className={styles.wrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  {variables.map((v) => <th key={`p-${v}`}>{v}ₙ</th>)}
                  {variables.map((v) => <th key={`g-${v}`}>∂f/∂{v}</th>)}
                  <th>‖∇f‖</th>
                  <th>f(xₙ)</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations.map((it) => (
                  <tr key={it.iteration}>
                    <td className={styles.idxCell}>{it.iteration}</td>
                    {it.point.map((val, i) => (
                      <td key={`p${i}`}>{fmt(val)}</td>
                    ))}
                    {it.gradient.map((val, i) => (
                      <td key={`g${i}`}>{fmtSci(val)}</td>
                    ))}
                    <td className={styles.normCell}>{fmtSci(it.gradient_norm)}</td>
                    <td>{fmt(it.f_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
