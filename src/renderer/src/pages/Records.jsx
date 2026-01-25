/* eslint-disable prettier/prettier */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import studentAPI from "../api/studentApi";

export default function Records() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const scrollPositionRef = useRef(0);
    const searchInputRef = useRef(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        cohorts: [],
        programs: [],
        colleges: [],
        years: [],
        districts: []
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'Full_Name',
        direction: 'asc'
    });
    const [showFilters, setShowFilters] = useState(false);

    const hasInitializedFromURL = useRef(false);
    const lastRefreshTimestamp = useRef(null);


    // Fetch students
    useEffect(() => {
        const refreshTimestamp = location.state?.refresh;
        if (refreshTimestamp && refreshTimestamp === lastRefreshTimestamp.current) return;

        const fetchStudents = async () => {
            setLoading(true);
            const result = await studentAPI.getStudents({ page: 1, limit: 500 });

            if (result.success) {
                setStudents(result.data);
                if (refreshTimestamp) lastRefreshTimestamp.current = refreshTimestamp;
            } else {
                console.error('Failed to fetch students:', result.error);
                alert('Failed to load students: ' + result.error);
            }
            setLoading(false);
        };

        fetchStudents();
    }, [location.state?.refresh]);

    // Ensure input stays enabled
    useEffect(() => {
        if (!loading && !isUpdating && searchInputRef.current) {
            searchInputRef.current.disabled = false;
            searchInputRef.current.readOnly = false;
        }
    }, [loading, isUpdating, students]);

    // Restore state from URL params
    useEffect(() => {
        if (loading || hasInitializedFromURL.current) return;

        const urlSearch = searchParams.get('search');
        const urlCohorts = searchParams.get('cohorts')?.split(',').filter(Boolean);
        const urlPrograms = searchParams.get('programs')?.split(',').filter(Boolean);
        const urlColleges = searchParams.get('colleges')?.split(',').filter(Boolean);
        const urlYears = searchParams.get('years')?.split(',').filter(Boolean);
        const urlDistricts = searchParams.get('districts')?.split(',').filter(Boolean);
        const urlSortKey = searchParams.get('sortKey');
        const urlSortDir = searchParams.get('sortDir');
        const urlShowFilters = searchParams.get('showFilters');

        if (urlSearch) setSearchTerm(urlSearch);
        if (urlCohorts?.length) setFilters(prev => ({ ...prev, cohorts: urlCohorts }));
        if (urlPrograms?.length) setFilters(prev => ({ ...prev, programs: urlPrograms }));
        if (urlColleges?.length) setFilters(prev => ({ ...prev, colleges: urlColleges }));
        if (urlYears?.length) setFilters(prev => ({ ...prev, years: urlYears }));
        if (urlDistricts?.length) setFilters(prev => ({ ...prev, districts: urlDistricts }));
        if (urlSortKey) setSortConfig(prev => ({ ...prev, key: urlSortKey }));
        if (urlSortDir) setSortConfig(prev => ({ ...prev, direction: urlSortDir }));
        if (urlShowFilters === 'true') setShowFilters(true);

        hasInitializedFromURL.current = true;
    }, [loading]);

    // Save scroll position
    useEffect(() => {
        const handleScroll = () => {
            scrollPositionRef.current = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            sessionStorage.setItem('recordsScrollPosition', scrollPositionRef.current.toString());
        };
    }, []);

    // Restore scroll position
    useEffect(() => {
        if (!loading && location.state?.fromStudentDetail) {
            const savedScrollPosition = sessionStorage.getItem('recordsScrollPosition');
            if (savedScrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScrollPosition, 10));
                }, 50);
            }
        }
    }, [loading, location.state]);

    // Sync state to URL params
    useEffect(() => {
        if (!hasInitializedFromURL.current) return;

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
    }, [searchTerm, filters, sortConfig, showFilters, setSearchParams]);

    // Filter options
    const filterOptions = useMemo(() => ({
        cohorts: [...new Set(students.map(s => s.Source_Sheet).filter(Boolean))].sort(),
        programs: [...new Set(students.map(s => s.Program).filter(Boolean))].sort(),
        colleges: [...new Set(students.map(s => s.College).filter(Boolean))].sort(),
        years: [...new Set(students.map(s => s.Current_Year).filter(Boolean))].sort(),
        districts: [...new Set(students.map(s => s.District).filter(Boolean))].sort()
    }), [students]);

    const toggleFilter = (filterType, value) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterType]: newValues };
        });
    };

    const clearAllFilters = () => {
        setFilters({ cohorts: [], programs: [], colleges: [], years: [], districts: [] });
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
            if (filters.cohorts.length && !filters.cohorts.includes(student.Source_Sheet)) return false;
            if (filters.programs.length && !filters.programs.includes(student.Program)) return false;
            if (filters.colleges.length && !filters.colleges.includes(student.College)) return false;
            if (filters.years.length && !filters.years.includes(student.Current_Year)) return false;
            if (filters.districts.length && !filters.districts.includes(student.District)) return false;

            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return (student.Full_Name || "").toLowerCase().includes(s) ||
                    (student.College || "").toLowerCase().includes(s) ||
                    (student.Program || "").toLowerCase().includes(s) ||
                    (student.District || "").toLowerCase().includes(s) ||
                    String(student.Contact_Number || "").toLowerCase().includes(s);
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
                return aValue < bValue ? (sortConfig.direction === 'asc' ? -1 : 1)
                    : aValue > bValue ? (sortConfig.direction === 'asc' ? 1 : -1)
                        : 0;
            });
        }

        return filtered;
    }, [students, searchTerm, filters, sortConfig]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?\nThis cannot be undone.`)) return;

        setIsUpdating(true);
        const result = await studentAPI.deleteStudent(id);

        if (result.success) {
            alert(`Student "${name}" deleted!`);
            setStudents(prev => prev.filter(s => s.id !== id));
        } else {
            alert('Delete failed: ' + result.error);
        }
        setIsUpdating(false);
    };

    const handleViewStudent = (id) => {
        navigate(`/records/${id}`, { state: { fromRecords: true } });
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
                        ref={searchInputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search by name, college, program, district, or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
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
                        <button className="btn-clear-filters" onClick={clearAllFilters}>
                            ✖ Clear All
                        </button>
                    )}

                </div>

                {/* Filters UI */}
                {showFilters && (
                    <div className="advanced-filters">
                        {['cohorts', 'programs', 'colleges', 'years', 'districts'].map(type => (
                            <div className="filter-group" key={type}>
                                <label className="filter-group-label">
                                    {type === 'cohorts' ? '📚 Cohort' :
                                        type === 'programs' ? '🎓 Program' :
                                            type === 'colleges' ? '🏫 College' :
                                                type === 'years' ? '📅 Year' : '📍 District'}
                                    {filters[type].length > 0 && `(${filters[type].length})`}
                                </label>
                                <div className="filter-checkboxes">
                                    {filterOptions[type].map(value => (
                                        <label key={value} className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={filters[type].includes(value)}
                                                onChange={() => toggleFilter(type, value)}
                                            />
                                            <span>{value}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
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
                        {['Full_Name', 'Program', 'College', 'Current_Year', 'District'].map(key => (
                            <th key={key} onClick={() => handleSort(key)} className="sortable">
                                {key === 'Full_Name' ? 'Name' :
                                    key === 'Program' ? 'Program' :
                                        key === 'College' ? 'College' :
                                            key === 'Current_Year' ? 'Year' : 'District'}
                                {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAndSortedStudents.length > 0 ? filteredAndSortedStudents.map(s => (
                        <tr key={s.id}>
                            <td>{s.Full_Name}</td>
                            <td>{s.Program}</td>
                            <td>{s.College}</td>
                            <td>{s.Current_Year}</td>
                            <td>{s.District}</td>
                            <td>
                                <button className="btn-view" onClick={() => handleViewStudent(s.id)}>View</button>
                                <button
                                    className="btn-delete-table"
                                    onClick={() => handleDelete(s.id, s.Full_Name)}
                                    disabled={isUpdating}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )) : (
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
