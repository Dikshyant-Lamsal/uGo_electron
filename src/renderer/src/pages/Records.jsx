/* eslint-disable prettier/prettier */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import studentAPI from "../api/studentApi";

export default function Records() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const [filters, setFilters] = useState({
        cohorts: searchParams.get('cohorts')?.split(',').filter(Boolean) || [],
        programs: searchParams.get('programs')?.split(',').filter(Boolean) || [],
        colleges: searchParams.get('colleges')?.split(',').filter(Boolean) || [],
        years: searchParams.get('years')?.split(',').filter(Boolean) || [],
        districts: searchParams.get('districts')?.split(',').filter(Boolean) || []
    });
    const [sortConfig, setSortConfig] = useState({
        key: searchParams.get('sortKey') || 'Full_Name',
        direction: searchParams.get('sortDir') || 'asc'
    });
    const [showFilters, setShowFilters] = useState(searchParams.get('showFilters') === 'true');

    // ✅ Sync state with URL params
    useEffect(() => {
        const params = new URLSearchParams();
        
        if (searchTerm) params.set('search', searchTerm);
        if (filters.cohorts.length) params.set('cohorts', filters.cohorts.join(','));
        if (filters.programs.length) params.set('programs', filters.programs.join(','));
        if (filters.colleges.length) params.set('colleges', filters.colleges.join(','));
        if (filters.years.length) params.set('years', filters.years.join(','));
        if (filters.districts.length) params.set('districts', filters.districts.join(','));
        if (sortConfig.key !== 'Full_Name') params.set('sortKey', sortConfig.key);
        if (sortConfig.direction !== 'asc') params.set('sortDir', sortConfig.direction);
        if (showFilters) params.set('showFilters', 'true');

        setSearchParams(params, { replace: true });
    }, [searchTerm, filters, sortConfig, showFilters]);

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
    }, []);

    const filterOptions = useMemo(() => {
        return {
            cohorts: [...new Set(students.map(s => s.Source_Sheet).filter(Boolean))].sort(),
            programs: [...new Set(students.map(s => s.Program).filter(Boolean))].sort(),
            colleges: [...new Set(students.map(s => s.College).filter(Boolean))].sort(),
            years: [...new Set(students.map(s => s.Current_Year).filter(Boolean))].sort(),
            districts: [...new Set(students.map(s => s.District).filter(Boolean))].sort()
        };
    }, [students]);

    const toggleFilter = (filterType, value) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            
            return {
                ...prev,
                [filterType]: newValues
            };
        });
    };

    const clearAllFilters = () => {
        setFilters({
            cohorts: [],
            programs: [],
            colleges: [],
            years: [],
            districts: []
        });
        setSearchTerm("");
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedStudents = useMemo(() => {
        let filtered = students.filter(student => {
            if (filters.cohorts.length > 0 && !filters.cohorts.includes(student.Source_Sheet)) {
                return false;
            }
            if (filters.programs.length > 0 && !filters.programs.includes(student.Program)) {
                return false;
            }
            if (filters.colleges.length > 0 && !filters.colleges.includes(student.College)) {
                return false;
            }
            if (filters.years.length > 0 && !filters.years.includes(student.Current_Year)) {
                return false;
            }
            if (filters.districts.length > 0 && !filters.districts.includes(student.District)) {
                return false;
            }

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const name = (student.Full_Name || "").toLowerCase();
                const college = (student.College || "").toLowerCase();
                const program = (student.Program || "").toLowerCase();
                const district = (student.District || "").toLowerCase();
                const contact = (student.Contact_Number || "").toLowerCase();

                return name.includes(search) ||
                    college.includes(search) ||
                    program.includes(search) ||
                    district.includes(search) ||
                    contact.includes(search);
            }

            return true;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key] || '';
                let bValue = b[sortConfig.key] || '';

                if (sortConfig.key.includes('GPA') || sortConfig.key.includes('Fee') || sortConfig.key.includes('Amount')) {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                } else {
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [students, searchTerm, filters, sortConfig]);

    const handleDelete = async (studentId, studentName) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${studentName}"?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) {
            return;
        }

        const result = await studentAPI.deleteStudent(studentId);

        if (result.success) {
            alert(`Student "${studentName}" deleted successfully!`);
            setStudents(students.filter(s => s.id !== studentId));
        } else {
            alert('Failed to delete student: ' + result.error);
        }
    };

    const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

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

            <div className="search-filter-section">
                <div className="search-box">
                    <label className="search-label">🔍 Search Students</label>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, college, program, district, or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-header">
                    <button 
                        className="btn-toggle-filters"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '▼' : '▶'} Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                    {activeFilterCount > 0 && (
                        <button 
                            className="btn-clear-filters"
                            onClick={clearAllFilters}
                        >
                            ✖ Clear All
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="advanced-filters">
                        <div className="filter-group">
                            <label className="filter-group-label">
                                📚 Cohort {filters.cohorts.length > 0 && `(${filters.cohorts.length})`}
                            </label>
                            <div className="filter-checkboxes">
                                {filterOptions.cohorts.map(cohort => (
                                    <label key={cohort} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.cohorts.includes(cohort)}
                                            onChange={() => toggleFilter('cohorts', cohort)}
                                        />
                                        <span>{cohort}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-group-label">
                                🎓 Program {filters.programs.length > 0 && `(${filters.programs.length})`}
                            </label>
                            <div className="filter-checkboxes">
                                {filterOptions.programs.map(program => (
                                    <label key={program} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.programs.includes(program)}
                                            onChange={() => toggleFilter('programs', program)}
                                        />
                                        <span>{program}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-group-label">
                                🏫 College {filters.colleges.length > 0 && `(${filters.colleges.length})`}
                            </label>
                            <div className="filter-checkboxes">
                                {filterOptions.colleges.map(college => (
                                    <label key={college} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.colleges.includes(college)}
                                            onChange={() => toggleFilter('colleges', college)}
                                        />
                                        <span>{college}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-group-label">
                                📅 Year {filters.years.length > 0 && `(${filters.years.length})`}
                            </label>
                            <div className="filter-checkboxes">
                                {filterOptions.years.map(year => (
                                    <label key={year} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.years.includes(year)}
                                            onChange={() => toggleFilter('years', year)}
                                        />
                                        <span>{year}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-group-label">
                                📍 District {filters.districts.length > 0 && `(${filters.districts.length})`}
                            </label>
                            <div className="filter-checkboxes">
                                {filterOptions.districts.map(district => (
                                    <label key={district} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.districts.includes(district)}
                                            onChange={() => toggleFilter('districts', district)}
                                        />
                                        <span>{district}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="records-count">
                    Showing: <strong>{filteredAndSortedStudents.length}</strong> / {students.length} students
                    {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`}
                </div>
            </div>

            <table className="records-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('Full_Name')} className="sortable">
                            Name {sortConfig.key === 'Full_Name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('Program')} className="sortable">
                            Program {sortConfig.key === 'Program' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('College')} className="sortable">
                            College {sortConfig.key === 'College' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('Current_Year')} className="sortable">
                            Year {sortConfig.key === 'Current_Year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('District')} className="sortable">
                            District {sortConfig.key === 'District' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAndSortedStudents.length > 0 ? (
                        filteredAndSortedStudents.map((s) => (
                            <tr key={s.id}>
                                <td>{s.Full_Name}</td>
                                <td>{s.Program}</td>
                                <td>{s.College}</td>
                                <td>{s.Current_Year}</td>
                                <td>{s.District}</td>
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
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--ev-c-text-3)' }}>
                                {searchTerm || activeFilterCount > 0 
                                    ? 'No students found matching your search criteria' 
                                    : 'No students in database'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}