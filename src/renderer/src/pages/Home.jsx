/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import studentAPI from "../api/studentApi";

export default function Home() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentStudents, setRecentStudents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Fetch students
            const studentsRes = await studentAPI.getStudents({ page: 1, limit: 1000 });
            const cohortsRes = await studentAPI.getCohorts();
            
            if (studentsRes.success) {
                const students = studentsRes.data;
                
                // Calculate statistics
                const districts = new Set();
                const colleges = new Set();
                const programs = new Set();
                
                students.forEach(s => {
                    if (s.District && s.District !== "Unknown") districts.add(s.District);
                    if (s.College && s.College !== "Unknown") colleges.add(s.College);
                    if (s.Program && s.Program !== "Unknown") programs.add(s.Program);
                });

                setStats({
                    totalStudents: students.length,
                    totalCohorts: cohortsRes.success ? cohortsRes.cohorts.length : 0,
                    totalDistricts: districts.size,
                    totalColleges: colleges.size,
                    totalPrograms: programs.size
                });

                // Get 5 most recent students (last 5 in the array)
                setRecentStudents(students.slice(-5).reverse());
            }
            
            setLoading(false);
        };

        fetchData();
    }, []);

    const quickActions = [
        {
            icon: "➕",
            title: "Add Student",
            description: "Register a new student",
            action: () => navigate("/add"),
            color: "#10b981"
        },
        {
            icon: "📋",
            title: "View Records",
            description: "Browse all student records",
            action: () => navigate("/records"),
            color: "#3b82f6"
        },
        {
            icon: "📊",
            title: "Analytics",
            description: "View statistics and insights",
            action: () => navigate("/statistics"),
            color: "#8b5cf6"
        },
        {
            icon: "📥",
            title: "Import Data",
            description: "Upload Excel files",
            action: () => navigate("/import"),
            color: "#f59e0b"
        }
    ];

    if (loading) {
        return (
            <div className="home-page">
                <div className="loading-inline">
                    <div className="loading-inline-spinner"></div>
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            {/* Welcome Section */}
            <div className="home-welcome">
                <div className="welcome-content">
                    <h1 className="welcome-title">Welcome to U-Go Scholarship Portal</h1>
                    <p className="welcome-subtitle">
                        Manage student records, track scholarships, and monitor academic progress
                    </p>
                </div>
                <div className="welcome-date">
                    {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="home-stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalStudents}</div>
                            <div className="stat-label">Total Students</div>
                        </div>
                    </div>

                    <div className="stat-card stat-secondary">
                        <div className="stat-icon">🎓</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalCohorts}</div>
                            <div className="stat-label">Active Cohorts</div>
                        </div>
                    </div>

                    <div className="stat-card stat-tertiary">
                        <div className="stat-icon">🏫</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalColleges}</div>
                            <div className="stat-label">Partner Colleges</div>
                        </div>
                    </div>

                    <div className="stat-card stat-quaternary">
                        <div className="stat-icon">📍</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalDistricts}</div>
                            <div className="stat-label">Districts Served</div>
                        </div>
                    </div>

                    <div className="stat-card stat-quinary">
                        <div className="stat-icon">📚</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalPrograms}</div>
                            <div className="stat-label">Academic Programs</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="home-section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            className="action-card"
                            onClick={action.action}
                            style={{ borderLeftColor: action.color }}
                        >
                            <div className="action-icon" style={{ backgroundColor: `${action.color}20`, color: action.color }}>
                                {action.icon}
                            </div>
                            <div className="action-content">
                                <h3 className="action-title">{action.title}</h3>
                                <p className="action-description">{action.description}</p>
                            </div>
                            <div className="action-arrow">→</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Students */}
            {recentStudents.length > 0 && (
                <div className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">Recently Added Students</h2>
                        <button className="btn-view-all" onClick={() => navigate("/records")}>
                            View All →
                        </button>
                    </div>
                    <div className="recent-students-list">
                        {recentStudents.map((student) => (
                            <div 
                                key={student.id} 
                                className="recent-student-card"
                                onClick={() => navigate(`/records/${student.id}`)}
                            >
                                <div className="student-avatar">
                                    {student.Full_Name?.charAt(0) || "S"}
                                </div>
                                <div className="student-info">
                                    <div className="student-name">{student.Full_Name}</div>
                                    <div className="student-details">
                                        {student.Student_ID && <span>ID: {student.Student_ID}</span>}
                                        {student.Program && <span>• {student.Program}</span>}
                                        {student.College && <span>• {student.College}</span>}
                                    </div>
                                </div>
                                <div className="student-arrow">→</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Info */}
            <div className="home-footer">
                <div className="footer-card">
                    <div className="footer-icon">💡</div>
                    <div className="footer-content">
                        <h4>Quick Tip</h4>
                        <p>Use the search bar in Records to quickly find students by name, ID, or program.</p>
                    </div>
                </div>

                <div className="footer-card">
                    <div className="footer-icon">📈</div>
                    <div className="footer-content">
                        <h4>Analytics</h4>
                        <p>Check the Analytics page for detailed insights into student distribution and performance.</p>
                    </div>
                </div>

                <div className="footer-card">
                    <div className="footer-icon">📁</div>
                    <div className="footer-content">
                        <h4>Bulk Import</h4>
                        <p>Import multiple student records at once using Excel files in the Import section.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}