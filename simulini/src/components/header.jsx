import SideBar from "../components/sidebar";

import React from "react";

export default function Header() {
  return (
    <div className="bg-gray-900 h-screen text-white flex flex-col">
      {/* Header */}
      <SideBar />
      {/* Divider under header */}
      <div className="border-t border-gray-800" />
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel */}
        <div className="w-1/2 flex flex-col justify-center items-start px-16">
          <h1 className="text-6xl font-extrabold leading-tight">
            <span className="block text-white">Shell</span>
            <span className="block text-teal-400">Simulates</span>
          </h1>
          <span>
            Your one and only innovative combined emulator and simulator of
            URLLC 5G topologies
          </span>
          <br />
          <span>
            You can not only make the topologies you want come in to a reality
            using the integrated free5gc-compose emulator but only simulate the
            latency and reliability of the topology based on the UPFs, gNBs and
            UEs placement in the topoogy
          </span>

          <div className="mt-8 flex space-x-4">
            <button className="py-8 px-16 bg-teal-400 rounded flex items-center justify-center hover:bg-teal-500 transition">
              Simulate
            </button>

            <button className="py-8 px-16 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700 transition">
              Contact Us
            </button>
          </div>
        </div>
        <div className="mb-16 flex flex-col justify-end">
          <div className="w-24 h-32 flex flex-col items-center justify-center border border-gray-500 rounded-full">
            <svg
              className="w-6 h-6 text-gray-500 animate-bounce"
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
        <div className="w-1/2 flex justify-center items-center">
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
