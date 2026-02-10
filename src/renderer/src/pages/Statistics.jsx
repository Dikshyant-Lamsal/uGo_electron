/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import studentAPI from "../api/studentApi";
import { Box, Card, CardContent, Typography, Grid, Chip, Paper, Collapse } from "@mui/material";
import { PieChart, BarChart } from "@mui/x-charts";

export default function Statistics() {
    const [searchParams, setSearchParams] = useSearchParams();
    const hasInitializedFromURL = useRef(false);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableCohorts, setAvailableCohorts] = useState([]);
    const [isLoadingCohorts, setIsLoadingCohorts] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        cohorts: [],
        programs: [],
        colleges: [],
        years: [],
        districts: []
    });
    const [showFilters, setShowFilters] = useState(false);

    // Dropdown states for each filter group
    const [expandedFilters, setExpandedFilters] = useState({
        cohorts: false,
        programs: false,
        colleges: false,
        years: false,
        districts: false
    });

    // ---------- Helpers ----------
    const normalizeText = (val) => val ? String(val).trim() : "Unknown";

    const normalize_cohort = (student) => {
        if (student.Cohort) return student.Cohort;
        const match = String(student.Source_Sheet || "").match(/\bC(\d+)\b/);
        return match ? `C${match[1]}` : "Unknown";
    };

    const countBy = (arr, getter) => {
        const map = {};
        arr.forEach(item => {
            const key = normalizeText(getter(item));
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    };

    // Fetch students
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            const res = await studentAPI.getStudents({ page: 1, limit: 1000 });
            if (res.success) {
                setStudents(res.data);
            }
            setLoading(false);
        };
        fetchStudents();
    }, []);

    // Fetch cohorts
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

    // Restore state from URL params
    useEffect(() => {
        if (loading || hasInitializedFromURL.current) return;

        const urlCohorts = searchParams.get('cohorts')?.split(',').filter(Boolean);
        const urlPrograms = searchParams.get('programs')?.split(',').filter(Boolean);
        const urlColleges = searchParams.get('colleges')?.split(',').filter(Boolean);
        const urlYears = searchParams.get('years')?.split(',').filter(Boolean);
        const urlDistricts = searchParams.get('districts')?.split(',').filter(Boolean);
        const urlShowFilters = searchParams.get('showFilters');

        const id = setTimeout(() => {
            if (urlCohorts?.length) setFilters(prev => ({ ...prev, cohorts: urlCohorts }));
            if (urlPrograms?.length) setFilters(prev => ({ ...prev, programs: urlPrograms }));
            if (urlColleges?.length) setFilters(prev => ({ ...prev, colleges: urlColleges }));
            if (urlYears?.length) setFilters(prev => ({ ...prev, years: urlYears }));
            if (urlDistricts?.length) setFilters(prev => ({ ...prev, districts: urlDistricts }));
            if (urlShowFilters === 'true') setShowFilters(true);
            hasInitializedFromURL.current = true;
        }, 0);

        return () => clearTimeout(id);
    }, [loading, searchParams]);

    // Sync state to URL params
    useEffect(() => {
        if (!hasInitializedFromURL.current) return;

        const params = new URLSearchParams();
        if (filters.cohorts.length) params.set('cohorts', filters.cohorts.join(','));
        if (filters.programs.length) params.set('programs', filters.programs.join(','));
        if (filters.colleges.length) params.set('colleges', filters.colleges.join(','));
        if (filters.years.length) params.set('years', filters.years.join(','));
        if (filters.districts.length) params.set('districts', filters.districts.join(','));
        if (showFilters) params.set('showFilters', 'true');

        setSearchParams(params, { replace: true });
    }, [filters, showFilters, setSearchParams]);

    // Filter options
    const filterOptions = useMemo(() => {
        const cohorts = availableCohorts;

        const getUniqueNormalized = (field) => {
            const seen = new Map();
            students
                .map(s => s[field])
                .filter(Boolean)
                .forEach(value => {
                    const normalized = normalizeText(value).toLowerCase();
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

    // Filter functions
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
    };

    const toggleFilterExpanded = (filterType) => {
        setExpandedFilters(prev => ({
            ...prev,
            [filterType]: !prev[filterType]
        }));
    };

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
        switch (type) {
            case 'cohorts': return 'Cohort';
            case 'programs': return 'Program';
            case 'colleges': return 'College';
            case 'years': return 'Year';
            case 'districts': return 'District';
            default: return type;
        }
    };

    const getFilterIcon = (type) => {
        switch (type) {
            case 'cohorts': return '📚';
            case 'programs': return '🎓';
            case 'colleges': return '🏫';
            case 'years': return '📅';
            case 'districts': return '📍';
            default: return '🔍';
        }
    };

    // Filter students
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Filter by cohort
            if (filters.cohorts.length > 0) {
                const studentCohort = student.Cohort || normalize_cohort(student);
                if (!filters.cohorts.includes(studentCohort)) return false;
            }

            // Filter by program
            if (filters.programs.length > 0) {
                const studentProgram = normalizeText(student.Program).toLowerCase();
                const matchesProgram = filters.programs.some(p =>
                    normalizeText(p).toLowerCase() === studentProgram
                );
                if (!matchesProgram) return false;
            }

            // Filter by college
            if (filters.colleges.length > 0) {
                const studentCollege = normalizeText(student.College).toLowerCase();
                const matchesCollege = filters.colleges.some(c =>
                    normalizeText(c).toLowerCase() === studentCollege
                );
                if (!matchesCollege) return false;
            }

            // Filter by year
            if (filters.years.length > 0) {
                const studentYear = normalizeText(student.Current_Year).toLowerCase();
                const matchesYear = filters.years.some(y =>
                    normalizeText(y).toLowerCase() === studentYear
                );
                if (!matchesYear) return false;
            }

            // Filter by district
            if (filters.districts.length > 0) {
                const studentDistrict = normalizeText(student.District).toLowerCase();
                const matchesDistrict = filters.districts.some(d =>
                    normalizeText(d).toLowerCase() === studentDistrict
                );
                if (!matchesDistrict) return false;
            }

            return true;
        });
    }, [students, filters]);

    const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

    // ---------- Calculations ----------
    const stats = useMemo(() => {
        if (!filteredStudents.length) return null;

        const byDistrict = countBy(filteredStudents, s => s.District);
        const byCollege = countBy(filteredStudents, s => s.College);
        const byCohort = countBy(filteredStudents, s => normalize_cohort(s));
        const byProgram = countBy(filteredStudents, s => s.Program);
        const byYear = countBy(filteredStudents, s => s.Current_Year);

        // Cohort + Course combined
        const byCohortCourse = {};
        filteredStudents.forEach(s => {
            const cohort = normalize_cohort(s);
            const course = normalizeText(s.Program);
            const key = `${cohort} - ${course}`;
            byCohortCourse[key] = (byCohortCourse[key] || 0) + 1;
        });

        return {
            totalStudents: filteredStudents.length,
            totalCohorts: Object.keys(byCohort).filter(c => c !== "Unknown").length,
            totalDistricts: Object.keys(byDistrict).filter(d => d !== "Unknown").length,
            totalColleges: Object.keys(byCollege).filter(c => c !== "Unknown").length,
            byDistrict,
            byCollege,
            byCohort,
            byProgram,
            byCohortCourse,
            byYear
        };
    }, [filteredStudents]);

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6">Loading analytics...</Typography>
            </Box>
        );
    }

    if (!stats) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6">No data available</Typography>
            </Box>
        );
    }

    // ---------- Chart Data ----------
    const toPieData = (obj) => Object.entries(obj)
        .filter(([label]) => label !== "Unknown")
        .map(([label, value], idx) => ({ id: idx, label, value }));

    const toBarData = (obj) => {
        const filtered = Object.entries(obj).filter(([label]) => label !== "Unknown");
        return {
            labels: filtered.map(([label]) => label),
            values: filtered.map(([, value]) => value)
        };
    };

    const districtBar = toBarData(stats.byDistrict);
    const collegeBar = toBarData(stats.byCollege);
    const programPie = toPieData(stats.byProgram);
    const cohortCourseBar = toBarData(stats.byCohortCourse);
    const cohortPie = toPieData(stats.byCohort);
    const yearBar = toBarData(stats.byYear);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Student distribution and insights
                </Typography>
            </Box>

            {/* Filter Controls */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                    <Box
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                            },
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Filters
                        </Typography>
                        {activeFilterCount > 0 && (
                            <Chip
                                label={activeFilterCount}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        )}
                    </Box>

                    {activeFilterCount > 0 && (
                        <Chip
                            label="Clear All"
                            onDelete={clearAllFilters}
                            color="error"
                            variant="outlined"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'error.light', color: 'white' }
                            }}
                        />
                    )}
                </Box>

                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {activeFilters.map(({ type, value }, index) => (
                            <Chip
                                key={`${type}-${value}-${index}`}
                                label={`${getFilterLabel(type)}: ${value}`}
                                onDelete={() => removeFilter(type, value)}
                                color="primary"
                                variant="filled"
                                size="small"
                                sx={{
                                    fontSize: '0.813rem',
                                    '& .MuiChip-deleteIcon': {
                                        fontSize: '1rem',
                                    }
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Filter Panel */}
                <Collapse in={showFilters}>
                    <Paper
                        elevation={3}
                        sx={{
                            mt: 2,
                            p: { xs: 2, sm: 3 },
                            borderRadius: 2,
                            backgroundColor: 'background.paper'
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            Filter Options
                        </Typography>

                        <Grid container spacing={2}>
                            {['cohorts', 'programs', 'colleges', 'years', 'districts'].map(type => (
                                <Grid item xs={12} sm={6} md={4} key={type}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                boxShadow: 2,
                                            }
                                        }}
                                    >
                                        {/* Filter Header (Dropdown Toggle) */}
                                        <Box
                                            onClick={() => toggleFilterExpanded(type)}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 1.5,
                                                cursor: 'pointer',
                                                backgroundColor: expandedFilters[type] ? 'primary.light' : 'background.default',
                                                transition: 'background-color 0.2s',
                                                '&:hover': {
                                                    backgroundColor: expandedFilters[type] ? 'primary.main' : 'action.hover',
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ fontSize: '1.2rem' }}>{getFilterIcon(type)}</span>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: expandedFilters[type] ? 'primary.contrastText' : 'text.primary',
                                                        fontSize: { xs: '0.875rem', sm: '0.938rem' }
                                                    }}
                                                >
                                                    {getFilterLabel(type)}s
                                                    {filters[type].length > 0 && ` (${filters[type].length})`}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    transform: expandedFilters[type] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                    color: expandedFilters[type] ? 'primary.contrastText' : 'text.secondary',
                                                }}
                                            >
                                                ▼
                                            </Typography>
                                        </Box>

                                        {/* Filter Options (Collapsible) */}
                                        <Collapse in={expandedFilters[type]}>
                                            <Box sx={{
                                                p: 1.5,
                                                maxHeight: 250,
                                                overflowY: 'auto',
                                                backgroundColor: 'background.paper',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    backgroundColor: 'action.hover',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    backgroundColor: 'primary.main',
                                                    borderRadius: '4px',
                                                },
                                            }}>
                                                {type === 'cohorts' && isLoadingCohorts ? (
                                                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                                        Loading cohorts...
                                                    </Typography>
                                                ) : filterOptions[type].length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ p: 1 }}>
                                                        No {type} available
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        {filterOptions[type].map(value => (
                                                            <Box
                                                                key={value}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    p: 0.5,
                                                                    borderRadius: 0.5,
                                                                    transition: 'background-color 0.15s',
                                                                    '&:hover': {
                                                                        backgroundColor: 'action.hover',
                                                                    },
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => toggleFilter(type, value)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={filters[type].includes(value)}
                                                                    onChange={() => { }}
                                                                    style={{
                                                                        marginRight: 8,
                                                                        cursor: 'pointer',
                                                                        width: '16px',
                                                                        height: '16px'
                                                                    }}
                                                                />
                                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                                                                    {value}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Collapse>

                {/* Records Count */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                    Showing: <strong>{filteredStudents.length}</strong> of {students.length} students
                    {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
                </Typography>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                <Grid item xs={6} sm={6} md={3}>
                    <KpiCard title="Total Students" value={stats.totalStudents} icon="👥" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <KpiCard title="Cohorts" value={stats.totalCohorts} icon="📚" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <KpiCard title="Districts" value={stats.totalDistricts} icon="📍" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <KpiCard title="Colleges" value={stats.totalColleges} icon="🏫" />
                </Grid>
            </Grid>

            {/* Charts Grid */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* 1. District-wise Count (Bar Chart) */}
                <Grid item xs={12} lg={6}>
                    <ChartCard title="District-wise Distribution" subtitle="Student count by district">
                        {districtBar.labels.length > 0 ? (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: districtBar.labels }]}
                                    series={[{ data: districtBar.values, label: 'Students' }]}
                                    height={300}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>

                {/* 2. College-wise Count (Bar Chart) */}
                <Grid item xs={12} lg={6}>
                    <ChartCard title="College-wise Distribution" subtitle="Student count by college">
                        {collegeBar.labels.length > 0 ? (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: collegeBar.labels }]}
                                    series={[{ data: collegeBar.values, label: 'Students' }]}
                                    height={300}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>

                {/* 3. Course-wise Count (Pie Chart) */}
                <Grid item xs={12} md={6} lg={6}>
                    <ChartCard title="Program Distribution" subtitle="Students by program">
                        {programPie.length > 0 ? (
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <PieChart
                                    series={[{ data: programPie }]}
                                    height={300}
                                    margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>

                {/* 4. Cohort + Course Combined (Bar Chart) */}
                <Grid item xs={12} md={6} lg={6}>
                    <ChartCard title="Cohort-Program Distribution" subtitle="Students by cohort and program">
                        {cohortCourseBar.labels.length > 0 ? (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: cohortCourseBar.labels }]}
                                    series={[{ data: cohortCourseBar.values, label: 'Students' }]}
                                    height={300}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>

                {/* 5. Cohort Distribution (Pie Chart) */}
                <Grid item xs={12} md={6} lg={6}>
                    <ChartCard title="Cohort Distribution" subtitle="Students by cohort">
                        {cohortPie.length > 0 ? (
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <PieChart
                                    series={[{ data: cohortPie }]}
                                    height={300}
                                    margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>

                {/* 6. Year-wise Distribution (Bar Chart) */}
                <Grid item xs={12} md={6} lg={6}>
                    <ChartCard title="Year-wise Distribution" subtitle="Students by current year">
                        {yearBar.labels.length > 0 ? (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: yearBar.labels }]}
                                    series={[{ data: yearBar.values, label: 'Students' }]}
                                    height={300}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
                                />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No data available
                            </Typography>
                        )}
                    </ChartCard>
                </Grid>
            </Grid>
        </Box>
    );
}

/* ===================== Supporting Components ===================== */
function KpiCard({ title, value, icon }) {
    return (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                }
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h4"
                        component="div"
                        sx={{
                            fontSize: { xs: '1.75rem', sm: '2.125rem' },
                            fontWeight: 'bold',
                            color: 'primary.main'
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography
                        variant="h4"
                        component="span"
                        sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                    >
                        {icon}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 4,
                }
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600 }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{ mb: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                        {subtitle}
                    </Typography>
                )}
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}