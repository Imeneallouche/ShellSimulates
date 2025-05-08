import "./App.css";
import Simulate from "./pages/simulate";
import Home from "./pages/home";
import Documentation from "./pages/documentation";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="App w-screen h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Simulate" element={<Simulate />} />
        <Route path="/Documentation" element={<Documentation />} />
      </Routes>
    </div>
  );
}

export default App;
