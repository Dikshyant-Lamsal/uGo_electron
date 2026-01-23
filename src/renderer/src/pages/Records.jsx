/* eslint-disable prettier/prettier */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import studentAPI from "../api/studentApi";  // ✅ Default import (no curly braces)

export default function Records() {
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [cohortFilter, setCohortFilter] = useState("All");


    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            const result = await studentAPI.getStudents({ page: 1, limit: 500 });

            if (result.success) {
                setStudents(result.data);
            } else {
                console.error('Failed to fetch students:', result.error);
                alert('Failed to load students: ' + result.error);
            }
            setLoading(false);
        };

        fetchStudents();
    }, []); // Empty dependency array = run once on mount

    // Get unique cohorts from students
    const cohorts = useMemo(() => {
        const uniqueCohorts = [...new Set(students.map(s => s.Source_Sheet))];
        return ["All", ...uniqueCohorts];
    }, [students]);

    // Filter students based on search and cohort
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Apply cohort filter
            if (cohortFilter !== "All" && student.Source_Sheet !== cohortFilter) {
                return false;
            }

            // Apply search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const name = (student.Full_Name || "").toLowerCase();
                const college = (student.College || "").toLowerCase();
                const program = (student.Program || "").toLowerCase();
                const district = (student.District || "").toLowerCase();

                return name.includes(search) ||
                    college.includes(search) ||
                    program.includes(search) ||
                    district.includes(search);
            }

            return true;
        });
    }, [students, searchTerm, cohortFilter]);  // ✅ Recompute when any of these change

    const handleDelete = async (studentId, studentName) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${studentName}"?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) {
            return;
        }

        // ✅ Use studentAPI instead of fetch
        const result = await studentAPI.deleteStudent(studentId);

        if (result.success) {
            alert(`Student "${studentName}" deleted successfully!`);
            // ✅ Remove from state instead of reload
            setStudents(students.filter(s => s.id !== studentId));
        } else {
            alert('Failed to delete student: ' + result.error);
        }
    };

    // ✅ Show loading state
    if (loading) {
        return (
            <div className="records-page">
                <h1 className="records-page-title">Student Records</h1>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="records-page">
            <h1 className="records-page-title">Student Records</h1>

            {/* Search and Filter Section */}
            <div className="search-filter-section">
                {/* Search Box */}
                <div className="search-box">
                    <label className="search-label">🔍 Search Students</label>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, college, program, or district..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Cohort Filter */}
                <div className="filter-section">
                    <label className="filter-label">Filter by Cohort:</label>
                    <div className="filter-radio-group">
                        {cohorts.map(cohort => (
                            <label key={cohort} className="filter-radio-option">
                                <input
                                    type="radio"
                                    name="cohort"
                                    value={cohort}
                                    checked={cohortFilter === cohort}
                                    onChange={(e) => setCohortFilter(e.target.value)}
                                />
                                <span>{cohort}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Count Display */}
                <div className="records-count">
                    Showing: {filteredStudents.length} / {students.length} students
                </div>
            </div>

            {/* Students Table */}
            <table className="records-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Program</th>
                        <th>College</th>
                        <th>Year</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((s) => (
                            <tr key={s.id}>
                                <td>{s.Full_Name}</td>
                                <td>{s.Program}</td>
                                <td>{s.College}</td>
                                <td>{s.Current_Year}</td>
                                <td>
                                    <button
                                        className="btn-view"
                                        onClick={() => navigate(`/records/${s.id}`)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="btn-delete-table"
                                        onClick={() => handleDelete(s.id, s.Full_Name)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--ev-c-text-3)' }}>
                                No students found matching your search criteria
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}