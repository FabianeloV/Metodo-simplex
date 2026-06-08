import { useState } from "react";
import { SolverPage }  from "./components/pages/SolverPage";
import { BinaryPage }  from "./components/pages/BinaryPage";
import { IntegerPage } from "./components/pages/IntegerPage";
import type { Method } from "./components/molecules/MethodSwitcher";

function App() {
  const [method, setMethod] = useState<Method>("simplex");

  if (method === "binary")  return <BinaryPage  onMethodChange={setMethod} />;
  if (method === "integer") return <IntegerPage onMethodChange={setMethod} />;
  return <SolverPage onMethodChange={setMethod} />;
}

export default App;
