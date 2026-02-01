/* eslint-disable prettier/prettier */
import { Link } from "react-router-dom";
import { useState } from "react";
import icon from '../assets/logo/icon.png';
import ThemeToggle from "./ThemeToggle";
import studentAPI from "../api/studentApi";
import { showInfo, showConfirm, showSuccess, showError } from "../utils/dialog";

function Header() {
  const [consolidating, setConsolidating] = useState(false);

  const handleDevToolsToggle = async () => {
    await showInfo(
      '🔧 Fixed! '
    );
  };

  return (
    <header className="app-header">


      <nav className="actions header-actions">
        <div className="action">
          <Link to="/home" className="action-btn">🏠︎ Home</Link>
        </div>

        <div className="action">
          <Link to="/add-student" className="action-btn">➕ Add Student</Link>
        </div>

        <div className="action">
          <Link to="/import" className="action-btn">📥 Import Excel</Link>
        </div>

        <div className="action">
          <button
            onClick={handleDevToolsToggle}
            className="action-btn"
            title="Instructions to fix frozen input fields"
          >
            🔧
          </button>
        </div>

        <ThemeToggle />
      </nav>
    </header>
  );
}

export default Header;