import { useState, useEffect, useCallback } from "react";
import { useAuthStoreActions } from "../stores/useAuthStore.js";
import { useQueryClient } from "@tanstack/react-query";
import NavItem from "./NavItem.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import sidebarData from "../data/sidebarData.jsx";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import ThemeToggle from "./ThemeToggle.jsx"
import authApi from "../services/authApi.js";


const DEFAULT_WIDTH = 250;
const MIN_WIDTH = 150;
const MAX_WIDTH = 360;
const COLLAPSED_WIDTH = 60;

export default function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const { logout } = useAuthStoreActions();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    queryClient.clear();
  };

  const startResizing = useCallback(() => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleResizing = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth);
    } else if (newWidth < MIN_WIDTH) {
      setSidebarWidth(DEFAULT_WIDTH);
      setIsSidebarOpen(false);
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleResizing);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleResizing);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleResizing, stopResizing]);

  return (
    <div className="h-full bg-slate-200 text-black dark:bg-slate-900 dark:text-white">
      <motion.aside
        className="h-full relative flex flex-col p-3 gap-4 overflow-x-hidden "
        initial={{ width: sidebarWidth }}
        animate={{ width: isSidebarOpen ? sidebarWidth : COLLAPSED_WIDTH }}
        transition={
          isResizing
            ? { duration: 0 } 
            : { duration: 0.8, ease: "easeOut" }
        }
      >
        <div className="flex justify-between">
          <button
            className="text-xl cursor-pointer p-1 hover:text-blue-500"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            data-tooltip-id={!isSidebarOpen ? "sidebar-tooltip" : undefined}
            data-tooltip-content="Toggle Sidebar"
          >
            <FontAwesomeIcon icon={faBars} />

          </button>
          {isSidebarOpen && <ThemeToggle />}
        </div>
        

        <nav className={`space-y-4 flex-1 overflow-y-auto overflow-x-hidden ${!isSidebarOpen ? 'no-scrollbar' : ''}`}>
          {sidebarData.map((item, index) => (
            <NavItem
              key={index}
              icon={item.icon}
              label={item.label}
              isSidebarOpen={isSidebarOpen}
              path={item.path}
              actionOpen={() => setIsSidebarOpen(true)}
            />
          ))}
        </nav>


        <button
          className="text-xl cursor-pointer self-center hover:text-blue-500 p-1"
          data-tooltip-id={!isSidebarOpen ? "sidebar-tooltip" : undefined}
          data-tooltip-content="Logout"
          onClick={handleLogout}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>

        {isSidebarOpen && (
          <div 
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none z-10 bg-blue-100 hover:bg-blue-300"
            onMouseDown={startResizing}  
          >
          </div>
        )}
        
      </motion.aside>
      {!isSidebarOpen && (
        <Tooltip 
          id="sidebar-tooltip"
          offset={20}
        />
      )}
    </div>
  )
}