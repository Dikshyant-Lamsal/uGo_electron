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

  const handleConsolidate = async () => {
    // ✅ Use showConfirm instead of window.confirm
    const confirmed = await showConfirm(
      "⚠️ WARNING: Database Consolidation\n\n" +
      "This will:\n" +
      "• Read all cohort sheets (ACC C1, ACC C2, C1, C2, C3, Database)\n" +
      "• Update existing students with new data\n" +
      "• Add new students from cohort sheets\n" +
      "• Create a backup before making changes\n\n" +
      "⏱️ This may take a few moments.\n\n" +
      "Continue?",
      "Database Consolidation"
    );

    if (!confirmed) return;

    setConsolidating(true);

    try {
      const result = await studentAPI.runConsolidator();

      if (result.success) {
        // ✅ Use showSuccess instead of alert
        await showSuccess(
          "✅ Consolidation Completed!\n\n" +
          "The Master Database has been updated.\n" +
          "A backup was created automatically.\n\n" +
          "The page will now refresh to show updated data.",
          "Success"
        );

        // Refresh the page to load new data
        window.location.reload();
      } else {
        // ✅ Use showError instead of alert
        await showError(
          "❌ Consolidation Failed\n\n" +
          "Error: " + result.error + "\n\n" +
          "Please check:\n" +
          "• Python is installed\n" +
          "• Required packages (pandas, openpyxl) are installed\n" +
          "• The Excel file is not open in another program",
          "Consolidation Failed"
        );
      }
    } catch (error) {
      // ✅ Use showError instead of alert
      await showError(
        "❌ Error Running Consolidator\n\n" +
        error.message,
        "Error"
      );
    } finally {
      setConsolidating(false);
    }
  };

  return (
    <header className="app-header">
      <nav className="logo">
        <Link to="/home" className="logo-link">
          <img src={icon} alt="ugo logo" className="logo-image" />
          <span className="logo-text">uGo Nepal Student Management App</span>
        </Link>
      </nav>

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
            onClick={handleConsolidate}
            className="action-btn action-btn-consolidate"
            disabled={consolidating}
            title="Sync data from cohort sheets to Master Database"
          >
            {consolidating ? '⏳ Syncing...' : '🔄 Sync Data'}
          </button>
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