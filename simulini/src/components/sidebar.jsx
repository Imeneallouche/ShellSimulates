import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function SideBar() {
  const Menus = [
    { title: "Home", Path: "/" },
    { title: "Simulate", Path: "/simulate" },
    { title: "Documentation", Path: "/documentation" },
  ];
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full flex items-center justify-between px-10 py-8 bg-gradient-to-r from-blue-100 to-blue-200 shadow-md">
      <div className="flex items-center space-x-3">
        <div className="text-3xl font-extrabold text-blue-600 tracking-tight animate-pulse">
          5G Core Simulator
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex space-x-24">
        {Menus.map((menu, idx) => {
          const isActive = location.pathname === menu.Path;
          return (
            <Link
              key={idx}
              to={menu.Path}
              className={`group relative flex flex-col items-center transition-all duration-300 ease-in-out ${
                isActive
                  ? "font-bold scale-110 text-blue-600"
                  : "font-medium text-gray-700 hover:text-blue-600"
              }`}
            >
              {menu.title}
              <span
                className={` h-[3px] rounded transition-all duration-300 ${
                  isActive
                    ? "w-full bg-blue-600"
                    : "w-0 group-hover:w-full bg-blue-400"
                }`}
              ></span>
            </Link>
          );
        })}
      </nav>

      {/* Time & Date */}
      <div className="text-base text-blue-700 font-medium">
        <div className="flex items-center space-x-4 px-4 py-2 bg-white rounded-lg shadow-inner">
          <span>{currentTime.toLocaleTimeString("en-GB")}</span>
          <div className="text-black">
            <span>
              {currentTime.toISOString().split("T")[0].replace(/-/g, "/")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
