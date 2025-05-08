import React, { useState } from "react";
import Header from "../components/header";
import { useNavigate } from "react-router-dom";

const projects = [
  { id: 1, category: "Simple", img: "simple.jpg" },
  { id: 2, category: "Medium", img: "medium.jpg" },
  { id: 3, category: "Complex", img: "complex.jpg" },
];

const categories = ["All", "Simple", "Medium", "Complex"];

export default function Home() {
  const [active, setActive] = useState("All");
  const filtered = projects.filter(
    (p) => active === "All" || p.category === active
  );

  const navigate = useNavigate();

  const handleTopologyClick = (type) => {
    navigate("/simulate", { state: { preset: type.toLowerCase() } });
  };

  return (
    <div className="flex flex-col">
      <Header />
      <div className="min-h-screen bg-gray-200 text-black py-16 px-8">
        <h2 className="text-4xl font-extrabold mb-6">
          Some URLLC <span className="text-blue-500">Topologies</span>
        </h2>
        <div className="flex space-x-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                active === cat
                  ? "bg-blue-500 text-white"
                  : "border-2 border-blue-600 text-black"
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
              className="bg-white hover:text-white text-black rounded-lg items-center text-center hover:scale-105 hover:bg-blue-500 transition cursor-pointer"
              onClick={() => handleTopologyClick(proj.category)}
            >
              <img
                src={require(`../assets/${proj.img}`)}
                alt={`Project ${proj.id}`}
                className="w-full h-96 object-cover"
              />
              <h2 className="p-4 text-lg font-semibold">{proj.category}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
