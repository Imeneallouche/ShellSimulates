import React from "react";
import { useState, useEffect } from "react";
import Topology3D from "../components/topology";
import SideBar from "../components/sidebar";
import axios from "axios";

export default function UrrlcTopologySimulatorUI() {
  const [nbUPF, setNbUPF] = useState(1);
  const [nbgNB, setNbgNB] = useState(1);
  const [nbUE, setNbUE] = useState(1);

  const [distances, setDistances] = useState([[""]]);
  const [links, setLinks] = useState([[false]]);

  const [result, setResult] = useState(null);

  // Called when the user clicks “Submit”
  const handleSubmit = async () => {
    try {
      const payload = {
        nbUPF,
        nbgNB,
        nbUE,
        distances,
        links,
      };

      const resp = await axios.post(
        "http://localhost:5000/api/topology",
        payload
      );
      // Expecting { average_latency: <number>, average_reliability: <number> }
      setResult(resp.data);
    } catch (err) {
      console.error("Submit failed", err);
    }
  };

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
      <SideBar />
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

          <button
            className="w-80 py-8 bg-gray-700 rounded mt-3 flex items-center justify-center text-gray-500 hover:bg-blue-600 hover:text-white"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </aside>

        {/* Main 3D Map Area */}
        <main className="flex-1 relative bg-gray-800">
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

        {/* Right Sidebar */}
        <aside className="w-80 bg-gray-800 p-4 space-y-6 overflow-y-auto">
          {/* Card: VITAE AT SCELERISQUE */}
          <div className="bg-gray-700 p-4 rounded border border-blue-600">
            <h3 className="text-sm font-semibold">Latency (ms)</h3>
            <p className="text-xs text-gray-400">
              the best, worst and average one
            </p>
            <div className="mt-2">
              <div className="flex space-x-4 text-sm">
                <div>
                  <div className="text-2xl font-semibold">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-gray-400 uppercase">best</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-gray-400 uppercase">worst</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-400">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-gray-400 uppercase">average</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
