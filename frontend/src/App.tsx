import { useState } from "react";
import { HomePage }      from "./components/pages/HomePage";
import { SolverPage }    from "./components/pages/SolverPage";
import { BinaryPage }    from "./components/pages/BinaryPage";
import { IntegerPage }   from "./components/pages/IntegerPage";
import { BisectionPage } from "./components/pages/BisectionPage";
import { MultivarPage }  from "./components/pages/MultivarPage";
import type { Method }   from "./types/method";

type Screen = Method | "home";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const goHome = () => setScreen("home");

  if (screen === "home")      return <HomePage      onSelect={setScreen} />;
  if (screen === "binary")    return <BinaryPage    onHome={goHome} />;
  if (screen === "integer")   return <IntegerPage   onHome={goHome} />;
  if (screen === "bisection") return <BisectionPage onHome={goHome} />;
  if (screen === "multivar")  return <MultivarPage  onHome={goHome} />;
  return <SolverPage onHome={goHome} />;
}

export default App;
