import React from "react";
import { useState, useEffect } from "react";
import Topology3D from "../components/topology";
import SideBar from "../components/sidebar";
import axios from "axios";
import { useLocation } from "react-router-dom";

export default function Simulate() {
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
  const location = useLocation();

  useEffect(() => {
    if (location.state?.preset) {
      const preset = location.state.preset;
      if (preset === "simple") {
        setNbUPF(1);
        setNbgNB(1);
        setNbUE(3);
        setDistances([["10"]]); // gNB0 → UPF0
        setLinks([[false]]);
      } else if (preset === "medium") {
        setNbUPF(2);
        setNbgNB(2);
        setNbUE(5);
        setDistances([
          ["10", ""], // gNB0 → UPF0
          ["5", "5"], // gNB1 → UPF0 & UPF1
        ]);
        setLinks([
          [false, false],
          [false, false],
        ]);
      } else if (preset === "complex") {
        setNbUPF(3);
        setNbgNB(3);
        setNbUE(7);
        setDistances([
          ["10", "5", ""], // gNB0 → UPF0 & UPF1
          ["10", "10", "10"], // gNB1 → all UPFs
          ["", "5", "10"], // gNB2 → UPF1 & UPF2
        ]);
        setLinks([
          [false, true, false],
          [true, false, true],
          [false, true, false],
        ]);
      }
    }
  }, [location.state]);

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
    <div
      className="h-screen w-full bg-white text-black
     flex flex-col"
    >
      {/* Top Stats Bar */}
      <SideBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-96 bg-white border-2 border-blue-500 p-4 space-y-6 overflow-y-auto">
          {/* UE input */}
          <div className="bg-gray-100 p-4 rounded border-2 border-blue-500">
            <h3 className="text-sm font-semibold uppercase">Number of UEs</h3>

            <input
              type="number"
              className="w-full bg-blue-300 text-sm text-white px-3 py-1 rounded"
              value={nbUE}
              onChange={(e) =>
                setNbUE(Math.max(1, Math.min(100, +e.target.value)))
              }
            />
          </div>

          {/* UPF input */}
          <div className="bg-gray-100 p-4 rounded border-2 border-blue-500">
            <h3 className="text-sm font-semibold uppercase">Number of UPFs</h3>
            <input
              className="w-full bg-blue-300 text-sm text-white px-3 py-1 rounded"
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
          <div className="bg-gray-100 p-4 rounded border-2 border-blue-500">
            <h3 className="text-sm font-semibold uppercase">Number of gNBs</h3>
            <input
              className="w-full bg-blue-300 text-sm text-white px-3 py-1 rounded"
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
          <div className="bg-gray-100 p-4 rounded border-2 border-blue-500">
            <h3 className="text-sm font-semibold uppercase">
              Distance between UPFs and gNBs
            </h3>
            <p className="text-xs text-blue-500">between each UPF and gNB</p>
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
                  <tr key={gnbIdx} className={gnbIdx % 2 ? "" : ""}>
                    <td className="px-1 py-0.5 text-left">{gnbIdx + 1}</td>
                    {Array.from({ length: nbUPF }, (_, upfIdx) => (
                      <td key={upfIdx} className="px-1 py-0.5">
                        <input
                          type="text"
                          className="w-full bg-blue-300 text-sm text-white px-4 py-1 rounded"
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
          <div className="bg-gray-100 p-4 rounded border-2 border-blue-500">
            <h3 className="text-sm font-semibold uppercase">
              Linking UPFs Matrix
            </h3>
            <p className="text-xs text-blue-500">check to link UPF pairs</p>
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
                  <tr key={rowIdx}>
                    <td className="px-1 py-0.5 text-left">{rowIdx + 1}</td>
                    {Array.from({ length: nbUPF }, (_, colIdx) => (
                      <td key={colIdx} className="px-1 py-0.5 text-center">
                        {colIdx > rowIdx ? (
                          <input
                            type="checkbox"
                            checked={links[rowIdx]?.[colIdx] || false}
                            onChange={(e) =>
                              handleLinkChange(rowIdx, colIdx, e.target.checked)
                            }
                          />
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="w-full py-4 bg-blue-500 rounded mt-3 flex items-center justify-center text-white border-2 border-blue-500 hover:bg-white hover:text-black"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </aside>

        {/* Main 3D Map Area */}
        <main className="flex-1 relative bg-gray-100">
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
        <aside className="w-80 bg-white p-4 space-y-6 overflow-y-auto">
          <div className="bg-gray-100 h-1/3 p-4 rounded border-2 border-blue-600">
            <h3 className="text-sm mt-2 font-semibold">Latency (ms)</h3>
            <p className="text-xs mt-2 text-blue-500">
              the best, worst and average one
            </p>
            <div className="mt-8 p-2">
              <div className="flex space-x-4 text-sm">
                <div>
                  <div className="text-2xl font-semibold">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-blue-500 uppercase mt-2">best</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-blue-500 uppercase mt-2">worst</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-400">
                    {result ? (result.average_latency * 1e3).toFixed(2) : "-"}{" "}
                  </div>
                  <div className="text-blue-500 uppercase mt-2">average</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 mt-4 rounded h-1/3 border-2 border-blue-600">
            <h3 className="text-sm mt-2 font-semibold">Reliability (%)</h3>
            <p className="text-xs mt-2 text-blue-500">
              the best, worst and average one
            </p>
            <div className="flex space-x-3 mt-4">
              {["best", "worst", "average"].map((label, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-blue-500 mt-2 rounded-full flex items-center justify-center text-white">
                    per
                  </div>
                  <div className="text-xs mt-2">70%</div>
                  <div className="text-[10px] text-blue-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
