import React from "react";
import { useState, useEffect } from "react";
import Topology3D from "../components/topology";

export default function UrrlcTopologySimulatorUI() {
  const [nbUPF, setNbUPF] = useState(1);
  const [nbgNB, setNbgNB] = useState(1);
  const [nbUE, setNbUE] = useState(1);

  const [distances, setDistances] = useState([[""]]);
  const [links, setLinks] = useState([[false]]);

  // adjust matrices when dimensions change
  useEffect(() => {
    // Distance matrix
    setDistances((prev) => {
      const newDist = Array.from({ length: nbgNB }, (_, i) =>
        Array.from({ length: nbUPF }, (_, j) => prev[i]?.[j] ?? "")
      );
      return newDist;
    });

    // Links matrix (UPF-to-UPF)
    setLinks((prev) => {
      const newLinks = Array.from({ length: nbUPF }, (_, i) =>
        Array.from({ length: nbUPF }, (_, j) => prev[i]?.[j] ?? false)
      );
      return newLinks;
    });
  }, [nbUPF, nbgNB]);

  // handle distance cell change
  const handleDistanceChange = (i, j, value) => {
    setDistances((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[i][j] = value;
      return copy;
    });
  };

  // handle link checkbox change
  const handleLinkChange = (i, j, checked) => {
    setLinks((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[i][j] = checked;
      return copy;
    });
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
      {/* Top Stats Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex justify-center items-center space-x-8 hover:pointer">
          <img
            src={require("../assets/logo.png")}
            className="h-16 cursor-pointer"
            alt="logo"
          />
          <div className="hover:pointer">
            {" "}
            <p>Shell</p>
            <p>Simulates</p>
          </div>
        </div>

        <div className="flex space-x-32">
          {["Home", "About us", "Simulate", "Documentation", "Contact Us"].map(
            (value, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-l font-semibold text-gray-400 hover:cursor-pointer hover:text-white">
                  {value}
                </span>
              </div>
            )
          )}
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>
            Time
            <br />
            <span className="font-medium text-white">13:44:31 2021.07.14</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-96 bg-gray-800 p-4 space-y-6 overflow-y-auto">
          {/* UE input */}
          <div className="bg-gray-700 p-4 rounded border border-blue-600">
            <h3 className="text-sm font-semibold uppercase">Number of UEs</h3>

            <input
              className="w-full text-gray-500"
              type="number"
              min="1"
              max="100"
              value={nbUE}
              onChange={(e) =>
                setNbUE(Math.max(1, Math.min(100, +e.target.value)))
              }
            />
          </div>

          {/* UPF input */}
          <div className="bg-gray-700 p-4 rounded border border-blue-600">
            <h3 className="text-sm font-semibold uppercase">Number of UPFs</h3>
            <input
              className="w-full text-gray-500"
              type="number"
              min="1"
              max="10"
              value={nbUPF}
              onChange={(e) =>
                setNbUPF(Math.max(1, Math.min(10, +e.target.value)))
              }
            />
          </div>

          {/* gNB input */}
          <div className="bg-gray-700 p-4 rounded border border-blue-600">
            <h3 className="text-sm font-semibold uppercase">Number of gNBs</h3>
            <input
              className="w-full text-gray-500"
              type="number"
              min="1"
              max="10"
              value={nbgNB}
              onChange={(e) =>
                setNbgNB(Math.max(1, Math.min(10, +e.target.value)))
              }
            />
          </div>

          {/* Distance matrix */}
          <div className="bg-gray-700 p-4 rounded border border-blue-600">
            <h3 className="text-sm font-semibold uppercase">
              Distance between UPFs and gNBs
            </h3>
            <p className="text-xs text-gray-400">between each UPF and gNB</p>
            <table className="w-full mt-3 text-xs table-fixed">
              <thead>
                <tr>
                  <th className="px-1 text-left">gNB \ UPF</th>
                  {Array.from({ length: nbUPF }, (_, upfIdx) => (
                    <th key={upfIdx} className="px-1 text-center">
                      {upfIdx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: nbgNB }, (_, gnbIdx) => (
                  <tr key={gnbIdx} className={gnbIdx % 2 ? "bg-gray-800" : ""}>
                    <td className="px-1 py-0.5 text-left">{gnbIdx + 1}</td>
                    {Array.from({ length: nbUPF }, (_, upfIdx) => (
                      <td key={upfIdx} className="px-1 py-0.5">
                        <input
                          type="text"
                          className="w-full bg-gray-600 text-sm text-white p-1 rounded"
                          value={distances[gnbIdx]?.[upfIdx] ?? ""}
                          onChange={(e) =>
                            handleDistanceChange(gnbIdx, upfIdx, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Linking UPFs matrix */}
          <div className="bg-gray-700 p-4 rounded border border-green-600">
            <h3 className="text-sm font-semibold uppercase">
              Linking UPFs Matrix
            </h3>
            <p className="text-xs text-gray-400">check to link UPF pairs</p>
            <table className="w-full mt-3 text-xs table-fixed">
              <thead>
                <tr>
                  <th className="px-1 text-left">UPF \ UPF</th>
                  {Array.from({ length: nbUPF }, (_, idx) => (
                    <th key={idx} className="px-1 text-center">
                      {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: nbUPF }, (_, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 ? "bg-gray-800" : ""}>
                    <td className="px-1 py-0.5 text-left">{rowIdx + 1}</td>
                    {Array.from({ length: nbUPF }, (_, colIdx) => (
                      <td key={colIdx} className="px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={links[rowIdx]?.[colIdx] || false}
                          onChange={(e) =>
                            handleLinkChange(rowIdx, colIdx, e.target.checked)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        {/* Main 3D Map Area */}
        <main className="flex-1 relative bg-gray-800">
          <div
            className="absolute inset-0 bg-center bg-cover opacity-60"
            style={{ backgroundImage: "url('/path/to/3d-map-render.png')" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Topology3D
              nbUPF={nbUPF}
              nbgNB={nbgNB}
              nbUE={nbUE}
              distances={distances}
              links={links}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
