/* eslint-disable prettier/prettier */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import studentAPI from "../api/studentApi";
import { showError, showSuccess, showConfirm } from "../utils/dialog";

export default function Records() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const scrollPositionRef = useRef(0);
    const searchInputRef = useRef(null);
    const headerRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingIds, setDeletingIds] = useState(new Set());
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [tableHasScroll, setTableHasScroll] = useState(false);
    const [isLoadingCohorts, setIsLoadingCohorts] = useState(true);

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

    const [availableCohorts, setAvailableCohorts] = useState([]);

    // Helper function to normalize cohort
    const normalize_cohort = (source_sheet) => {
        if (!source_sheet) return 'C1';
        const str = String(source_sheet);
        const match = str.match(/\bC(\d+)\b/);
        if (match) {
            return `C${match[1]}`;
        }
        return 'C1';
    };

    // Helper function to normalize text
    const normalizeText = (text) => {
        if (!text) return '';
        return String(text).toLowerCase().replace(/[.\s]/g, '');
    };

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
                await showError('Failed to load students: ' + result.error);
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

    // Handle scroll effect for sticky header
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 10;
            setIsHeaderScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if table needs horizontal scrolling
    useEffect(() => {
        const checkTableScroll = () => {
            if (tableWrapperRef.current) {
                const hasScroll = tableWrapperRef.current.scrollWidth > tableWrapperRef.current.clientWidth;
                setTableHasScroll(hasScroll);
            }
        };

        checkTableScroll();
        window.addEventListener('resize', checkTableScroll);
        return () => window.removeEventListener('resize', checkTableScroll);
    }, [students]);

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

        // Defer state updates to avoid synchronous setState calls inside the effect
        const id = setTimeout(() => {
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
        }, 0);

        return () => clearTimeout(id);
    }, [loading, searchParams]);

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

    useEffect(() => {
        const fetchCohorts = async () => {
            setIsLoadingCohorts(true);
            const result = await studentAPI.getCohorts();
            if (result.success) {
                setAvailableCohorts(result.cohorts);
            }
            setIsLoadingCohorts(false);
        };
        fetchCohorts();
    }, []);

    // Filter options
    const filterOptions = useMemo(() => {
        const cohorts = availableCohorts;

        const getUniqueNormalized = (field) => {
            const seen = new Map();
            students
                .map(s => s[field])
                .filter(Boolean)
                .forEach(value => {
                    const normalized = normalizeText(value);
                    if (!seen.has(normalized)) {
                        seen.set(normalized, value);
                    }
                });
            return Array.from(seen.values()).sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
        };

        return {
            cohorts: [...new Set(cohorts)].sort(),
            programs: getUniqueNormalized('Program'),
            colleges: getUniqueNormalized('College'),
            years: getUniqueNormalized('Current_Year'),
            districts: getUniqueNormalized('District')
        };
    }, [students, availableCohorts]);

    const toggleFilter = (filterType, value) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterType]: newValues };
        });
    };

    const removeFilter = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType].filter(v => v !== value)
        }));
    };

    const clearAllFilters = () => {
        setFilters({ cohorts: [], programs: [], colleges: [], years: [], districts: [] });
        setSearchTerm("");
    };

    const clearSearch = () => {
        setSearchTerm("");
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedStudents = useMemo(() => {
        let filtered = students.filter(student => {
            if (filters.cohorts.length) {
                const studentCohort = student.Cohort || normalize_cohort(student.Source_Sheet);
                if (!filters.cohorts.includes(studentCohort)) return false;
            }

            if (filters.programs.length) {
                const studentProgram = normalizeText(student.Program);
                const matchesProgram = filters.programs.some(p => normalizeText(p) === studentProgram);
                if (!matchesProgram) return false;
            }

            if (filters.colleges.length) {
                const studentCollege = normalizeText(student.College);
                const matchesCollege = filters.colleges.some(c => normalizeText(c) === studentCollege);
                if (!matchesCollege) return false;
            }

            if (filters.years.length) {
                const studentYear = normalizeText(student.Current_Year);
                const matchesYear = filters.years.some(y => normalizeText(y) === studentYear);
                if (!matchesYear) return false;
            }

            if (filters.districts.length) {
                const studentDistrict = normalizeText(student.District);
                const matchesDistrict = filters.districts.some(d => normalizeText(d) === studentDistrict);
                if (!matchesDistrict) return false;
            }

            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return (student.Full_Name || "").toLowerCase().includes(s) ||
                    (student.Student_ID || "").toLowerCase().includes(s) ||
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
        const confirmed = await showConfirm(
            `Are you sure you want to delete "${name}"?\nThis cannot be undone.`,
            'Delete Student'
        );

        if (!confirmed) return;

        setDeletingIds(prev => new Set(prev).add(id));
        setIsUpdating(true);
        
        const result = await studentAPI.deleteStudent(id);

        if (result.success) {
            await showSuccess(`Student "${name}" deleted!`);
            setStudents(prev => prev.filter(s => s.id !== id));
        } else {
            await showError('Delete failed: ' + result.error);
        }
        
        setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        setIsUpdating(false);
    };

    const handleViewStudent = (id) => {
        navigate(`/records/${id}`, { state: { fromRecords: true } });
    };

    const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

    // Get all active filters as an array
    const activeFilters = useMemo(() => {
        const allFilters = [];
        Object.entries(filters).forEach(([type, values]) => {
            values.forEach(value => {
                allFilters.push({ type, value });
            });
        });
        return allFilters;
    }, [filters]);

    const getFilterLabel = (type) => {
        switch(type) {
            case 'cohorts': return 'Cohort';
            case 'programs': return 'Program';
            case 'colleges': return 'College';
            case 'years': return 'Year';
            case 'districts': return 'District';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="records-page">
                <div className="records-page-header">
                    <h1 className="records-page-title">Student Records</h1>
                </div>
                <div className="loading-container" style={{ 
                    textAlign: 'center', 
                    padding: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div className="spinner" style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px' }}>Loading students...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="records-page">
            {/* Sticky Header with Search */}
            <div 
                ref={headerRef}
                className={`records-page-header ${isHeaderScrolled ? 'scrolled' : ''}`}
            >
                <h1 className="records-page-title">Student Records</h1>

                <div className="search-filter-section">
                    {/* Search Box */}
                    <div className="search-box">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="search-input"
                                placeholder="Search by name, Student ID, college, program, district, or contact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                                disabled={isUpdating}
                            />
                            {searchTerm && (
                                <button
                                    className="clear-search-btn"
                                    onClick={clearSearch}
                                    title="Clear search"
                                    disabled={isUpdating}
                                >
                                    ✖
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {activeFilters.length > 0 && (
                        <div className="active-filters-display">
                            {activeFilters.map(({ type, value }, index) => (
                                <div key={`${type}-${value}-${index}`} className="active-filter-chip">
                                    <span className="filter-chip-label">{getFilterLabel(type)}:</span>
                                    <span className="filter-chip-value">{value}</span>
                                    <button
                                        className="filter-chip-remove"
                                        onClick={() => removeFilter(type, value)}
                                        title={`Remove ${value}`}
                                        disabled={isUpdating}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter Controls */}
                    <div className="filter-controls">
                        <div className="filter-toggle-wrapper">
                            <button
                                className="btn-toggle-filters"
                                onClick={() => setShowFilters(!showFilters)}
                                disabled={isUpdating}
                            >
                                <span className="filter-icon">⚙️</span>
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="filter-badge">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {activeFilterCount > 0 && (
                            <button 
                                className="btn-clear-filters" 
                                onClick={clearAllFilters}
                                disabled={isUpdating}
                            >
                                ✖ Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="advanced-filters">
                            {['cohorts', 'programs', 'colleges', 'years', 'districts'].map(type => (
                                <div className="filter-group" key={type}>
                                    <label className="filter-group-label">
                                        {type === 'cohorts' ? '📚 Cohort' :
                                            type === 'programs' ? '🎓 Program' :
                                                type === 'colleges' ? '🏫 College' :
                                                    type === 'years' ? '📅 Year' : '📍 District'}
                                        {filters[type].length > 0 && ` (${filters[type].length})`}
                                    </label>
                                    <div className="filter-checkboxes">
                                        {type === 'cohorts' && isLoadingCohorts ? (
                                            <div style={{ padding: '10px', color: '#666', fontSize: '14px' }}>
                                                Loading cohorts...
                                            </div>
                                        ) : filterOptions[type].length === 0 ? (
                                            <div style={{ padding: '10px', color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                                                No {type} available
                                            </div>
                                        ) : (
                                            filterOptions[type].map(value => (
                                                <label key={value} className="checkbox-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters[type].includes(value)}
                                                        onChange={() => toggleFilter(type, value)}
                                                        disabled={isUpdating}
                                                    />
                                                    <span>{value}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Records Count */}
                    <div className="records-count">
                        Showing: <strong>{filteredAndSortedStudents.length}</strong> of {students.length} students
                        {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div 
                ref={tableWrapperRef}
                className={`records-table-wrapper ${tableHasScroll ? 'has-scroll' : ''}`}
            >
                <table className="records-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('Student_ID')} className="sortable">
                                Student ID {sortConfig.key === 'Student_ID' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
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
                        {filteredAndSortedStudents.length > 0 ? filteredAndSortedStudents.map(s => {
                            const isDeleting = deletingIds.has(s.id);
                            return (
                                <tr key={s.id} className={isDeleting ? 'deleting' : ''}>
                                    <td><strong>{s.Student_ID}</strong></td>
                                    <td>{s.Full_Name}</td>
                                    <td>{s.Program}</td>
                                    <td>{s.College}</td>
                                    <td>{s.Current_Year}</td>
                                    <td>{s.District}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button 
                                                className="btn-view" 
                                                onClick={() => handleViewStudent(s.id)}
                                                disabled={isDeleting}
                                            >
                                                <span>👁️</span>
                                                <span>View</span>
                                            </button>
                                            <button
                                                className="btn-delete-table"
                                                onClick={() => handleDelete(s.id, s.Full_Name)}
                                                disabled={isDeleting || isUpdating}
                                            >
                                                {isDeleting ? (
                                                    <>
                                                        <span className="btn-spinner" style={{
                                                            display: 'inline-block',
                                                            width: '12px',
                                                            height: '12px',
                                                            border: '2px solid #ffffff',
                                                            borderTop: '2px solid transparent',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite'
                                                        }}></span>
                                                        <span>Deleting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>🗑️</span>
                                                        <span>Delete</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7">
                                    <div className="table-empty-state">
                                        <div className="table-empty-state-icon">📋</div>
                                        <div className="table-empty-state-text">
                                            {searchTerm || activeFilterCount > 0
                                                ? 'No students found matching your search criteria'
                                                : 'No students in database'}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                tr.deleting {
                    opacity: 0.6;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}