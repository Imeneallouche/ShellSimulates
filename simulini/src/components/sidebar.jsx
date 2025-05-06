import React from "react";
import { Link } from "react-router-dom";

export default function SideBar() {
  const Menus = [
    { title: "Home", Path: "/" },
    { title: "About Us", Path: "/AboutUs" },
    { title: "Simulate", Path: "/Simulate" },
    { title: "Documentation", Path: "/Documentation" },
    { title: "Contact Us", Path: "/ContactUs" },
  ];

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-700">
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
              <Link
                to={Menus[idx].Path}
                className="text-l font-semibold text-gray-400 hover:cursor-pointer hover:text-white"
              >
                {value}
              </Link>
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
  );
}
