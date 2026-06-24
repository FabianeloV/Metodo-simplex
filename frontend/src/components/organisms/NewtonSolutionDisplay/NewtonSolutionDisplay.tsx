import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import type { NewtonResponse } from "../../../types/newton";
import styles from "./NewtonSolutionDisplay.module.css";

interface NewtonSolutionDisplayProps {
  result: NewtonResponse | null;
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

export const NewtonSolutionDisplay: React.FC<NewtonSolutionDisplayProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Aplicando el método de Newton-Raphson…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const { optimal_x, optimal_value, nature, goal_satisfied, status } = result;
  const converged = status === "optimal";

  return (
    <section className={styles.card} aria-labelledby="newton-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="newton-result-heading" className={styles.cardTitle}>
            {converged && goal_satisfied
              ? "Solución: Óptimo Encontrado"
              : converged
              ? "Solución: Punto Estacionario"
              : "Sin Convergencia"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {converged && goal_satisfied ? (
          <Badge color="green">✓ {nature}</Badge>
        ) : converged ? (
          <Badge color="blue">{nature}</Badge>
        ) : (
          <Badge color="red">No convergió</Badge>
        )}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f(x)</span>
          <code className={styles.expr}>{result.function_str}</code>
        </div>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f′(x)</span>
          <code className={styles.expr}>{result.derivative_str}</code>
        </div>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f″(x)</span>
          <code className={styles.expr}>{result.second_derivative_str}</code>
        </div>
      </div>

      {optimal_x !== null && optimal_value !== null && (
        <div className={styles.metrics}>
          <MetricCard label="x óptimo" value={fmt(optimal_x)} highlight />
          <MetricCard label="f(x)" value={fmt(optimal_value)} highlight />
          <MetricCard label="Naturaleza" value={nature ?? "—"} />
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
                  <th>xₙ</th>
                  <th>f(xₙ)</th>
                  <th>f′(xₙ)</th>
                  <th>f″(xₙ)</th>
                  <th>xₙ₊₁</th>
                  <th>|paso|</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations.map((it) => (
                  <tr key={it.iteration}>
                    <td className={styles.idxCell}>{it.iteration}</td>
                    <td>{fmt(it.x_n)}</td>
                    <td>{fmt(it.f_xn)}</td>
                    <td>{fmtSci(it.df_xn)}</td>
                    <td>{fmtSci(it.d2f_xn)}</td>
                    <td className={styles.nextCell}>{fmt(it.x_next)}</td>
                    <td>{fmtSci(it.step)}</td>
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
