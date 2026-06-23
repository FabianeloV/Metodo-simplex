// ─── Método gráfico para optimización no restringida de una variable ─────────
// Evalúa y grafica un polinomio f(x) de una variable sobre [a, b], localiza sus
// puntos críticos (raíces de f′) y determina el óptimo global en el intervalo
// (comparando puntos críticos y extremos). Todo el cálculo es del lado cliente.
//
// Convención de coeficientes: de mayor a menor grado (igual que el backend):
//   coeffs = [c_n, c_{n-1}, ..., c_1, c_0]  →  f(x) = c_n·xⁿ + ... + c_1·x + c_0

export interface PlotPoint {
  x: number;
  y: number;
}

export interface CriticalPoint {
  x: number;
  fx: number;
  type: "máximo" | "mínimo" | "inflexión";
}

export interface GraphicalResult {
  optimalX: number;
  optimalValue: number;
  optimalAtEndpoint: boolean;
  nature: string;
  goal: "max" | "min";
  critical: CriticalPoint[];
  points: PlotPoint[];
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  functionStr: string;
  derivativeStr: string;
}

/** Evalúa el polinomio en x mediante el método de Horner. */
export function evaluatePoly(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}

/** Derivada analítica (regla de la potencia). Devuelve coeficientes mayor→menor. */
export function derivative(coeffs: number[]): number[] {
  const degree = coeffs.length - 1;
  if (degree <= 0) return [0];
  const d: number[] = [];
  for (let i = 0; i < coeffs.length - 1; i++) {
    d.push(coeffs[i] * (degree - i));
  }
  return d;
}

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
};

function superscript(n: number): string {
  return String(n).split("").map((d) => SUP[d] ?? d).join("");
}

function fmtCoef(c: number): string {
  return Number.isInteger(c) ? String(c) : String(Number(c.toPrecision(6)));
}

/** Convierte coeficientes (mayor→menor grado) en texto legible: "x² - 4x + 3". */
export function formatPoly(coeffs: number[], varName = "x"): string {
  const degree = coeffs.length - 1;
  const terms: { sign: string; body: string }[] = [];

  coeffs.forEach((c, idx) => {
    const power = degree - idx;
    if (Math.abs(c) < 1e-12) return;
    const coef = Math.abs(c);
    const coefStr = fmtCoef(coef);

    let body: string;
    if (power === 0) body = coefStr;
    else if (power === 1) body = coef === 1 ? varName : `${coefStr}${varName}`;
    else {
      const unit = `${varName}${superscript(power)}`;
      body = coef === 1 ? unit : `${coefStr}${unit}`;
    }
    terms.push({ sign: c < 0 ? "-" : "+", body });
  });

  if (terms.length === 0) return "0";
  let out = (terms[0].sign === "-" ? "-" : "") + terms[0].body;
  for (let i = 1; i < terms.length; i++) out += ` ${terms[i].sign} ${terms[i].body}`;
  return out;
}

/** Bisección sobre la derivada para refinar una raíz de f′ en [lo, hi]. */
function bisectDerivativeRoot(d: number[], lo: number, hi: number, iters = 60): number {
  let fLo = evaluatePoly(d, lo);
  let mid = (lo + hi) / 2;
  for (let i = 0; i < iters; i++) {
    mid = (lo + hi) / 2;
    const fMid = evaluatePoly(d, mid);
    if (fMid === 0) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return mid;
}

/** Puntos críticos interiores: detecta cambios de signo de f′ y los refina. */
function findCriticalPoints(coeffs: number[], a: number, b: number, scan = 2000): CriticalPoint[] {
  const d = derivative(coeffs);
  const dd = derivative(d);
  const crits: CriticalPoint[] = [];

  const classify = (x: number): CriticalPoint => {
    const second = evaluatePoly(dd, x);
    const type = second > 1e-9 ? "mínimo" : second < -1e-9 ? "máximo" : "inflexión";
    return { x, fx: evaluatePoly(coeffs, x), type };
  };

  const step = (b - a) / scan;
  let prevX = a;
  let prevV = evaluatePoly(d, prevX);

  for (let i = 1; i <= scan; i++) {
    const x = a + i * step;
    const v = evaluatePoly(d, x);
    if (prevV === 0) {
      crits.push(classify(prevX));
    } else if (prevV * v < 0) {
      crits.push(classify(bisectDerivativeRoot(d, prevX, x)));
    }
    prevX = x;
    prevV = v;
  }
  return crits.sort((p, q) => p.x - q.x);
}

/**
 * Resuelve gráficamente: muestrea f(x) en [a, b], halla puntos críticos y el
 * óptimo global (según `goal`), comparando críticos con los extremos a y b.
 */
export function solveGraphical(
  coeffs: number[],
  a: number,
  b: number,
  goal: "max" | "min",
  plotSamples = 240,
): GraphicalResult {
  if (!(a < b)) throw new Error("El intervalo debe cumplir a < b.");
  if (coeffs.every((c) => Math.abs(c) < 1e-12)) {
    throw new Error("La función no puede ser idénticamente cero.");
  }

  const critical = findCriticalPoints(coeffs, a, b);

  const candidates: { x: number; fx: number }[] = [
    ...critical.map((c) => ({ x: c.x, fx: c.fx })),
    { x: a, fx: evaluatePoly(coeffs, a) },
    { x: b, fx: evaluatePoly(coeffs, b) },
  ];

  let best = candidates[0];
  for (const cand of candidates) {
    const better = goal === "max" ? cand.fx > best.fx : cand.fx < best.fx;
    if (better) best = cand;
  }

  const optimalAtEndpoint =
    Math.abs(best.x - a) < 1e-9 || Math.abs(best.x - b) < 1e-9;
  const matchCrit = critical.find((c) => Math.abs(c.x - best.x) < 1e-7);
  const nature = matchCrit
    ? matchCrit.type
    : goal === "max"
      ? "máximo (en el borde)"
      : "mínimo (en el borde)";

  // Muestreo de la curva para graficar
  const points: PlotPoint[] = [];
  const step = (b - a) / plotSamples;
  for (let i = 0; i <= plotSamples; i++) {
    const x = a + i * step;
    points.push({ x, y: evaluatePoly(coeffs, x) });
  }

  // Límites verticales con un pequeño margen
  const ys = points.map((p) => p.y);
  let yMin = Math.min(best.fx, ...ys);
  let yMax = Math.max(best.fx, ...ys);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const padY = (yMax - yMin) * 0.08;

  return {
    optimalX: best.x,
    optimalValue: best.fx,
    optimalAtEndpoint,
    nature,
    goal,
    critical,
    points,
    bounds: { xMin: a, xMax: b, yMin: yMin - padY, yMax: yMax + padY },
    functionStr: formatPoly(coeffs),
    derivativeStr: formatPoly(derivative(coeffs)),
  };
}
