export type Method = "simplex" | "binary" | "integer" | "bisection" | "multivar";

export interface MethodInfo {
  value: Method;
  icon: string;
  label: string;
  title: string;
  sub: string;
  description: string;
}

export const METHODS: MethodInfo[] = [
  {
    value: "simplex",
    icon: "Σ",
    label: "Simplex",
    title: "Método Simplex",
    sub: "Solver de Programación Lineal",
    description: "Maximizá o minimizá una función lineal sujeta a restricciones, resuelta con el método Big-M.",
  },
  {
    value: "binary",
    icon: "01",
    label: "Entera Binaria",
    title: "Entera Binaria",
    sub: "Branch & Bound — Variables 0/1",
    description: "Programación lineal entera con variables binarias, resuelta por Branch & Bound.",
  },
  {
    value: "integer",
    icon: "IP",
    label: "Entera Pura",
    title: "Entera Pura",
    sub: "Branch & Bound — Variables enteras ≥ 0",
    description: "Programación lineal entera con variables enteras no negativas, resuelta por Branch & Bound.",
  },
  {
    value: "bisection",
    icon: "ƒ",
    label: "No Restringida (1 variable)",
    title: "No Restringida de una Variable",
    sub: "Optimización sin restricciones de una sola variable",
    description: "Encontrá extremos de una función de una variable con bisección, Newton o el método gráfico.",
  },
  {
    value: "multivar",
    icon: "∇",
    label: "No Restringida (varias variables)",
    title: "No Restringida de varias Variables",
    sub: "Optimización sin restricciones — múltiples variables",
    description: "Optimizá funciones multivariable sin restricciones mediante el método del gradiente.",
  },
];
