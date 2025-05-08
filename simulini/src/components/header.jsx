import SideBar from "../components/sidebar";
import { useNavigate } from "react-router-dom";
import React from "react";
export default function Header() {
  const navigate = useNavigate();
  return (
    <div className="bg-white h-screen text-black flex flex-col">
      {/* Header */}
      <SideBar />
      {/* Divider under header */}
      <div className="border-t border-blue-800" />
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel */}
        <div className="w-1/2 text-xl flex flex-col justify-center items-start px-16">
          <div className="mb-8">
            <h1 className="text-6xl font-extrabold leading-tight">
              <span className="block text-blue-500">5G core</span>
              <span className="block text-blue-500">Simulator</span>
            </h1>
          </div>
          <h2>
            Your one and only innovative combined emulator and simulator of
            URLLC 5G topologies
          </h2>
          <br />
          <h2>
            You can not only make the topologies you want come in to a reality
            using the integrated free5gc-compose emulator but only simulate the
            latency and reliability of the topology based on the UPFs, gNBs and
            UEs placement in the topoogy
          </h2>

          <div className="mt-12 flex space-x-4">
            <button
              onClick={() => navigate("/simulate")}
              className="py-4 px-16 bg-blue-500 rounded flex items-center text-white font-semibold justify-center hover:bg-teal-500 transition"
            >
              Simulate
            </button>

            <button
              onClick={() => navigate("/documentation")}
              className="py-4 px-16 bg-white text-blue-600 border-2 border-blue-600 rounded hover:border-teal-500 hover:text-teal-500 transition font-semibold"
            >
              Documentation
            </button>
          </div>
        </div>
        <div className="mb-4 flex flex-col justify-end">
          <div className="w-16 h-24 flex flex-col items-center justify-center border border-blue-500 rounded-full">
            <svg
              className="w-6 h-6 text-blue-500 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {/* Right Panel */}
        <div className="w-2/5 h-5/6 flex justify-center items-center">
          <img
            src={require("../assets/cover.png")}
            alt="Designer Illustration"
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
