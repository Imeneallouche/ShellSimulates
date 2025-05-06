import "./App.css";
import Simulate from "./pages/simulate";
import Home from "./pages/home";
import Documentation from "./pages/documentation";
import ContactUs from "./pages/contactUs";
import AboutUs from "./pages/aboutUs";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="App w-screen h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Simulate" element={<Simulate />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/Documentation" element={<Documentation />} />
        <Route path="/ContactUs" element={<ContactUs />} />
      </Routes>
    </div>
  );
}

export default App;
