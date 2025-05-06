import SideBar from "../components/sidebar";

import React, { useState } from "react";
import Header from "../components/header";

const projects = [
  { id: 1, category: "Simple", img: "topologySimple1.png" },
  { id: 2, category: "Medium", img: "topologySimple1.png" },
  { id: 3, category: "Complex", img: "topologySimple1.png" },
];
const categories = ["All", "Simple", "Medium", "Complex"];

export default function Home() {
  const [active, setActive] = useState("All");
  const filtered = projects.filter(
    (p) => active === "All" || p.category === active
  );
  return (
    <div className="bg-gray-900 text-white flex flex-col">
      <Header />

      <div className="min-h-screen bg-gray-900 text-white py-16 px-8">
        <h2 className="text-4xl font-extrabold mb-6">
          Some URLLC <span className="text-teal-400">Topologies</span>
        </h2>
        <div className="flex space-x-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                active === cat
                  ? "bg-teal-400 text-gray-900"
                  : "bg-gray-800 text-gray-400"
              }`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-96">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition"
            >
              <img
                src={require(`../assets/${proj.img}`)}
                alt={`Project ${proj.id}`}
                className="w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
