import { useState } from "react";
import { HomePage }      from "./components/pages/HomePage";
import { SolverPage }    from "./components/pages/SolverPage";
import { BinaryPage }    from "./components/pages/BinaryPage";
import { IntegerPage }   from "./components/pages/IntegerPage";
import { BisectionPage } from "./components/pages/BisectionPage";
import { MultivarPage }  from "./components/pages/MultivarPage";
import type { Method }   from "./types/method";

type Screen = Method | "home";

const LAST_METHOD_KEY = "simplex-app:last-method";

function readLastMethod(): Method {
  const stored = localStorage.getItem(LAST_METHOD_KEY);
  if (stored === "simplex" || stored === "binary" || stored === "integer" ||
      stored === "bisection" || stored === "multivar") {
    return stored;
  }
  return "simplex";
}

function App() {
  const [screen, setScreen]         = useState<Screen>("home");
  const [lastMethod, setLastMethod] = useState<Method>(readLastMethod);
  const goHome = () => setScreen("home");

  const handleSelect = (m: Method) => {
    setScreen(m);
    setLastMethod(m);
    localStorage.setItem(LAST_METHOD_KEY, m);
  };

  if (screen === "home")      return <HomePage      lastMethod={lastMethod} onSelect={handleSelect} />;
  if (screen === "binary")    return <BinaryPage    onHome={goHome} />;
  if (screen === "integer")   return <IntegerPage   onHome={goHome} />;
  if (screen === "bisection") return <BisectionPage onHome={goHome} />;
  if (screen === "multivar")  return <MultivarPage  onHome={goHome} />;
  return <SolverPage onHome={goHome} />;
}

export default App;
