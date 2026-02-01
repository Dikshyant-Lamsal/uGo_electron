/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import studentAPI from "../api/studentApi";
import { Box, Card, CardContent, Typography, Grid, Chip, IconButton, Paper } from "@mui/material";
import { PieChart, BarChart } from "@mui/x-charts";

export default function Statistics() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableCohorts, setAvailableCohorts] = useState([]);
    
    // Filter states
    const [selectedCohorts, setSelectedCohorts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

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

    useEffect(() => {
        const fetchCohorts = async () => {
            const result = await studentAPI.getCohorts();
            if (result.success) {
                setAvailableCohorts(result.cohorts);
            }
        };
        fetchCohorts();
    }, []);

    // ---------- Helpers ----------
    const normalizeText = (val) => val ? String(val).trim() : "Unknown";

    const normalizeCohort = (student) => {
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

    // Get unique districts
    const uniqueDistricts = useMemo(() => {
        const districts = new Set();
        students.forEach(s => {
            const district = normalizeText(s.District);
            if (district !== "Unknown") districts.add(district);
        });
        return Array.from(districts).sort();
    }, [students]);

    // Filter students based on selections
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Filter by cohort
            if (selectedCohorts.length > 0) {
                const cohort = normalizeCohort(student);
                if (!selectedCohorts.includes(cohort)) return false;
            }
            
            // Filter by district
            if (selectedDistricts.length > 0) {
                const district = normalizeText(student.District);
                if (!selectedDistricts.includes(district)) return false;
            }
            
            return true;
        });
    }, [students, selectedCohorts, selectedDistricts]);

    // ---------- Calculations ----------
    const stats = useMemo(() => {
        if (!filteredStudents.length) return null;

        const byDistrict = countBy(filteredStudents, s => s.District);
        const byCollege = countBy(filteredStudents, s => s.College);
        const byCohort = countBy(filteredStudents, s => normalizeCohort(s));
        const byProgram = countBy(filteredStudents, s => s.Program);
        const byYear = countBy(filteredStudents, s => s.Current_Year);
        
        // Cohort + Course combined
        const byCohortCourse = {};
        filteredStudents.forEach(s => {
            const cohort = normalizeCohort(s);
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

    // Handle filter changes
    const toggleCohort = (cohort) => {
        setSelectedCohorts(prev => 
            prev.includes(cohort) 
                ? prev.filter(c => c !== cohort)
                : [...prev, cohort]
        );
    };

    const toggleDistrict = (district) => {
        setSelectedDistricts(prev => 
            prev.includes(district) 
                ? prev.filter(d => d !== district)
                : [...prev, district]
        );
    };

    const clearFilters = () => {
        setSelectedCohorts([]);
        setSelectedDistricts([]);
    };

    const activeFilterCount = selectedCohorts.length + selectedDistricts.length;

    if (loading) {
        return (
            <Box className="statistics-page">
                <Box className="loading-inline">
                    <Box className="loading-inline-spinner"></Box>
                    Loading analytics...
                </Box>
            </Box>
        );
    }

    if (!stats) {
        return (
            <Box className="statistics-page">
                <Box className="stats-empty">No data available</Box>
            </Box>
        );
    }

    // ---------- Chart Data ----------
    const toPieData = (obj) =>
        Object.entries(obj)
            .filter(([label]) => label !== "Unknown")
            .map(([label, value], idx) => ({
                id: idx,
                label,
                value
            }));

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
        <Box className="statistics-page">
            {/* Header */}
            <Box className="stats-header">
                <Box>
                    <Typography variant="h4" className="stats-title">
                        Analytics Dashboard
                    </Typography>
                    <Typography className="stats-subtitle">
                        Student distribution and insights
                    </Typography>
                </Box>
                
                <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-toggle-filters"
                    sx={{
                        backgroundColor: 'var(--ev-button-alt-bg)',
                        color: 'var(--color-text-1)',
                        '&:hover': {
                            backgroundColor: 'var(--ev-button-alt-hover-bg)',
                        },
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                    {activeFilterCount > 0 && (
                        <Box className="filter-badge" sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {activeFilterCount}
                        </Box>
                    )}
                </IconButton>
            </Box>

            {/* Filter Panel */}
            {showFilters && (
                <Paper className="stats-filters" elevation={0}>
                    <Box className="stats-filters-header">
                        <Typography variant="h6" fontWeight={600}>
                            Filter Options
                        </Typography>
                        {activeFilterCount > 0 && (
                            <Chip
                                label="Clear All"
                                onClick={clearFilters}
                                onDelete={clearFilters}
                                color="error"
                                size="small"
                            />
                        )}
                    </Box>
                    
                    <Grid container spacing={3}>
                        {/* Cohort Filter */}
                        <Grid item xs={12} md={6}>
                            <Typography className="filter-group-label">
                                📚 Cohorts
                            </Typography>
                            <Box className="filter-options">
                                {availableCohorts.sort().map(cohort => (
                                    <Chip
                                        key={cohort}
                                        label={cohort}
                                        onClick={() => toggleCohort(cohort)}
                                        color={selectedCohorts.includes(cohort) ? "primary" : "default"}
                                        variant={selectedCohorts.includes(cohort) ? "filled" : "outlined"}
                                        className="filter-chip"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* District Filter */}
                        <Grid item xs={12} md={6}>
                            <Typography className="filter-group-label">
                                📍 Districts
                            </Typography>
                            <Box className="filter-options">
                                {uniqueDistricts.map(district => (
                                    <Chip
                                        key={district}
                                        label={district}
                                        onClick={() => toggleDistrict(district)}
                                        color={selectedDistricts.includes(district) ? "secondary" : "default"}
                                        variant={selectedDistricts.includes(district) ? "filled" : "outlined"}
                                        className="filter-chip"
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* KPI Cards */}
            <Grid container spacing={3} className="stats-kpi-grid">
                <KpiCard 
                    title="Total Students" 
                    value={stats.totalStudents}
                    icon="👥"
                />
                <KpiCard 
                    title="Active Cohorts" 
                    value={stats.totalCohorts}
                    icon="🎓"
                />
                <KpiCard 
                    title="Districts" 
                    value={stats.totalDistricts}
                    icon="📍"
                />
                <KpiCard 
                    title="Colleges" 
                    value={stats.totalColleges}
                    icon="🏫"
                />
            </Grid>

            {/* Charts Grid */}
            <Grid container spacing={3} className="stats-charts-grid">
                {/* 1. District-wise Count (Bar Chart) */}
                <ChartCard title="District-wise Distribution" subtitle="Student count by district">
                    <BarChart
                        height={340}
                        xAxis={[{ 
                            scaleType: "band", 
                            data: districtBar.labels,
                            tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 11 }
                        }]}
                        series={[{ 
                            data: districtBar.values,
                            color: '#3b82f6',
                            label: 'Students'
                        }]}
                        margin={{ bottom: 80, left: 50, right: 20, top: 20 }}
                    />
                </ChartCard>

                {/* 2. College-wise Count (Bar Chart) */}
                <ChartCard title="College-wise Distribution" subtitle="Student count by college">
                    <BarChart
                        height={340}
                        xAxis={[{ 
                            scaleType: "band", 
                            data: collegeBar.labels,
                            tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 }
                        }]}
                        series={[{ 
                            data: collegeBar.values,
                            color: '#8b5cf6',
                            label: 'Students'
                        }]}
                        margin={{ bottom: 100, left: 50, right: 20, top: 20 }}
                    />
                </ChartCard>

                {/* 3. Course-wise Count (Pie Chart) */}
                <ChartCard title="Course-wise Distribution" subtitle="Student count by program">
                    <PieChart
                        height={340}
                        series={[
                            {
                                data: programPie,
                                innerRadius: 60,
                                outerRadius: 110,
                                paddingAngle: 2,
                                cornerRadius: 5,
                                highlightScope: { faded: 'global', highlighted: 'item' }
                            }
                        ]}
                        slotProps={{
                            legend: {
                                direction: 'column',
                                position: { vertical: 'middle', horizontal: 'right' },
                                padding: 0,
                            }
                        }}
                    />
                </ChartCard>

                {/* 4. Cohort + Course Combined (Bar Chart) */}
                <ChartCard title="Cohort-Course Distribution" subtitle="Student count by cohort and course">
                    <BarChart
                        height={340}
                        xAxis={[{ 
                            scaleType: "band", 
                            data: cohortCourseBar.labels,
                            tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 9 }
                        }]}
                        series={[{ 
                            data: cohortCourseBar.values,
                            color: '#f59e0b',
                            label: 'Students'
                        }]}
                        margin={{ bottom: 120, left: 50, right: 20, top: 20 }}
                    />
                </ChartCard>

                {/* 5. Cohort Distribution (Pie Chart) */}
                <ChartCard title="Cohort Distribution" subtitle="Student count by cohort">
                    <PieChart
                        height={340}
                        series={[
                            {
                                data: cohortPie,
                                innerRadius: 60,
                                outerRadius: 110,
                                paddingAngle: 2,
                                cornerRadius: 5,
                                highlightScope: { faded: 'global', highlighted: 'item' }
                            }
                        ]}
                        slotProps={{
                            legend: {
                                direction: 'column',
                                position: { vertical: 'middle', horizontal: 'right' },
                                padding: 0,
                            }
                        }}
                    />
                </ChartCard>

                {/* 6. Year-wise Distribution (Bar Chart) */}
                <ChartCard title="Year-wise Distribution" subtitle="Student count by current academic year">
                    <BarChart
                        height={340}
                        xAxis={[{ 
                            scaleType: "band", 
                            data: yearBar.labels
                        }]}
                        series={[{ 
                            data: yearBar.values,
                            color: '#10b981',
                            label: 'Students'
                        }]}
                        margin={{ bottom: 60, left: 50, right: 20, top: 20 }}
                    />
                </ChartCard>
            </Grid>
        </Box>
    );
}

/* =====================
   Supporting Components
   ===================== */

function KpiCard({ title, value, icon }) {
    return (
        <Grid item xs={12} sm={6} md={3}>
            <Card className="kpi-card" elevation={0}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography className="kpi-label">
                                {title}
                            </Typography>
                            <Typography className="kpi-value">
                                {value}
                            </Typography>
                        </Box>
                        <Box className="kpi-icon">
                            {icon}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <Grid item xs={12} md={6}>
            <Card className="chart-card" elevation={0}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" className="chart-title">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" className="chart-subtitle">
                            {subtitle}
                        </Typography>
                    )}
                    {children}
                </CardContent>
            </Card>
        </Grid>
    );
}