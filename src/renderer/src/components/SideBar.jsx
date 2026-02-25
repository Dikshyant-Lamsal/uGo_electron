/* eslint-disable prettier/prettier */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import icon from '../assets/logo/icon.png';
import studentAPI from '../api/studentApi';

export default function Sidebar({ onThemeToggle, currentTheme }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [exportStatus, setExportStatus] = useState(null); // null | 'loading' | 'success' | 'error'

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
    const closeMobileSidebar = () => setIsMobileOpen(false);

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/records', icon: '📋', label: 'Records' },
        { path: '/add-student', icon: '➕', label: 'Add Student' },
        { path: '/import', icon: '📥', label: 'Import Records' },
        { path: '/statistics', icon: '📊', label: 'Statistics' },
    ];

    const handleExport = async () => {
        setExportStatus('loading');
        try {
            const result = await studentAPI.exportFile();
            if (result.canceled) {
                setExportStatus(null);
                return;
            }
            setExportStatus(result.success ? 'success' : 'error');
        } catch {
            setExportStatus('error');
        } finally {
            setTimeout(() => setExportStatus(null), 3000);
        }
    };

    const getExportIcon = () => {
        if (exportStatus === 'loading') return '⏳';
        if (exportStatus === 'success') return '✅';
        if (exportStatus === 'error') return '❌';
        return '💾';
    };

    const getExportLabel = () => {
        if (exportStatus === 'loading') return 'Exporting...';
        if (exportStatus === 'success') return 'Backup Successful!';
        if (exportStatus === 'error') return 'Export Failed';
        return 'Export Backup';
    };

    return (
        <>
            <style>{`
                .sidebar-action-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px 12px 4px;
                    border-top: 1px solid var(--sidebar-border, rgba(0,0,0,0.1));
                }

                .sidebar-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 9px 12px;
                    border: none;
                    border-radius: 8px;
                    background: var(--sidebar-action-bg, rgba(0,0,0,0.05));
                    color: #000000;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s, opacity 0.2s;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .sidebar-action-btn:hover:not(:disabled) {
                    background: var(--sidebar-action-hover-bg, rgba(0,0,0,0.1));
                }

                .sidebar-action-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .sidebar-action-btn.success {
                    background: rgba(34, 197, 94, 0.25);
                    color: #000000;
                }

                .sidebar-action-btn.error {
                    background: rgba(239, 68, 68, 0.2);
                    color: #000000;
                }

                .sidebar-action-btn.loading {
                    background: rgba(99, 102, 241, 0.15);
                    color: #000000;
                }

                .sidebar-action-icon {
                    font-size: 15px;
                    flex-shrink: 0;
                    width: 20px;
                    text-align: center;
                }

                .sidebar-action-text {
                    opacity: 1;
                    transition: opacity 0.2s, width 0.2s;
                }

                .sidebar.collapsed .sidebar-action-text {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                }

                .sidebar.collapsed .sidebar-action-btn {
                    justify-content: center;
                    padding: 9px;
                }

                .sidebar.collapsed .sidebar-action-group {
                    padding: 12px 8px 4px;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .sidebar-action-btn.loading .sidebar-action-icon {
                    display: inline-block;
                    animation: spin 1s linear infinite;
                }
            `}</style>

            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <a href="/" className="sidebar-logo">
                        <img
                            src={icon}
                            alt="Logo"
                            className="sidebar-logo-image"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="sidebar-logo-text">Student Portal</span>
                    </a>
                    <button
                        className="sidebar-toggle"
                        onClick={toggleSidebar}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '▶' : '◀'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="sidebar-nav-list">
                        {navItems.map((item) => (
                            <li key={item.path} className="sidebar-nav-item">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                                    }
                                    onClick={closeMobileSidebar}
                                >
                                    <span className="sidebar-nav-icon">{item.icon}</span>
                                    <span className="sidebar-nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Export Button */}
                <div className="sidebar-action-group">
                    <button
                        className={`sidebar-action-btn ${exportStatus || ''}`}
                        onClick={handleExport}
                        disabled={exportStatus === 'loading'}
                        title="Export all data as Excel backup"
                    >
                        <span className="sidebar-action-icon">{getExportIcon()}</span>
                        <span className="sidebar-action-text">{getExportLabel()}</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        className="theme-toggle"
                        onClick={onThemeToggle}
                        title="Toggle theme"
                    >
                        <span>{currentTheme === 'dark' ? '🌙' : '☀️'}</span>
                        <span className="theme-toggle-text">
                            {currentTheme === 'dark' ? 'Dark' : 'Light'}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile Toggle */}
            <button
                className="mobile-sidebar-toggle"
                onClick={toggleMobileSidebar}
                title="Toggle sidebar"
            >
                ☰
            </button>

            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
                onClick={closeMobileSidebar}
            />
        </>
    );
}