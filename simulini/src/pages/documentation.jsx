import React from "react";
import SideBar from "../components/sidebar";
import doc1 from "../assets/documentation1.png";
import doc2 from "../assets/documentations2.jpg";

export default function Documentation() {
  return (
    <div className="min-h-screen w-full bg-gray-100 text-black flex flex-col">
      <SideBar />
      <main className="flex-1 p-8 space-y-20">
        {/* Section 1 - Text Left / Image Right */}
        <section className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-extrabold text-blue-500 mb-2">5G Core Simulator</h1>
              <p class="indent-[2em]" className="text-lg leading-relaxed font-light">
                Welcome to the documentation of <strong>5G core Simulator</strong>, a simulation and visualization platform for private 5G core networks. It supports UPF (User Plane Function) topologies, link configuration, and graphical inspection of the core architecture.
              </p>
            </div>
            {/* Project Purpose */}
            <div>
              <h2 className="text-3xl font-bold text-blue-500 mb-2">Project Purpose</h2>
              <p class="indent-[2em]" className="text-lg leading-relaxed font-light">
                The simulator offers a user-friendly interface to model and analyze UPF relationships in a simulated 5G network. It helps engineers visualize data flows and optimize performance through an interactive UI.
              </p>
            </div>
          </div>
          <div className="w-1/3 ">
            <img
              src={doc1}
              alt="5G Core Simulator Screenshot"
              className=" rounded-lg shadow-md"
            />
          </div>
        </section>

        {/* Section 2 - Image Left / Text Right */}
        <section className="flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-6">
            {/* Features */}
            <div>
              <h2 className="text-3xl font-bold text-blue-500 mb-2">Features</h2>
              <ul className="list-disc list-inside text-lg leading-relaxed font-light">
                <li >Create custom UPF nodes</li>
                <li>Define link relationships via matrix UI</li>
                <li>Visualize network topology in real-time</li>
                <li>Export the topology as an image</li>
                <li>Save and restore configurations locally</li>
              </ul>
            </div>
            {/* Additional Resources */}
            <div>
              <h2 className="text-3xl font-bold text-blue-500 mb-2">Additional Resources</h2>
              <p class="indent-[2em]" className="text-lg leading-relaxed font-light">
                You can find the full project report and codebase on GitHub, including technical architecture, logic, and UI walkthroughs.
              </p>
              <a
                class="indent-[2em]"
                href="https://github.com/Imeneallouche/ShellSimulates"
                className="text-blue-600 underline text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 View GitHub Repository
              </a>
            </div>
          </div>
          <div className="w-1/3">
            <img
              src={doc2}
              alt="Features Screenshot"
              className=" rounded-lg shadow-md"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 text-center text-xs text-gray-500">
          Made with ❤️ by the 5G Core Simulator team
        </footer>
      </main>
    </div>
  );
}
