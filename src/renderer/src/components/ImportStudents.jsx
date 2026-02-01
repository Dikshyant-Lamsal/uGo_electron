/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import studentAPI from '../api/studentApi';
import { showInfo, showError, showSuccess, showConfirm, showWarning } from '../utils/dialog';

function ImportStudents() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [sourceSheet, setSourceSheet] = useState('C1');
    const [importing, setImporting] = useState(false);
    const [availableCohorts, setAvailableCohorts] = useState(['C1', 'C2', 'C3']);
    const [showNewCohortInput, setShowNewCohortInput] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [creatingCohort, setCreatingCohort] = useState(false);
    const [isLoadingCohorts, setIsLoadingCohorts] = useState(true);
    const [isSelectingFile, setIsSelectingFile] = useState(false);

    // Load available cohorts on mount
    useEffect(() => {
        loadCohorts();
    }, []);

    const loadCohorts = async () => {
        setIsLoadingCohorts(true);
        const result = await studentAPI.getCohorts();
        if (result.success && result.cohorts.length > 0) {
            setAvailableCohorts(result.cohorts);
        }
        setIsLoadingCohorts(false);
    };

    const getFilePath = async () => {
        setIsSelectingFile(true);
        try {
            const filePath = await globalThis.api.excel.getPath();
            if (!filePath) {
                setIsSelectingFile(false);
                return;
            }

            setSelectedFile({
                path: filePath,
                name: filePath.split(/[\\/]/).pop()
            });
        } catch (error) {
            await showError('Error selecting file: ' + error.message, 'File Selection Error');
        } finally {
            setIsSelectingFile(false);
        }
    };

    const handleAddCohort = async () => {
        if (!newCohortName.trim()) {
            await showWarning('Please enter a cohort name', 'Missing Cohort Name');
            return;
        }

        // Validate format
        if (!/^C\d+$/.test(newCohortName.trim().toUpperCase())) {
            await showWarning('Cohort name must be in format: C4, C5, C6, etc.', 'Invalid Format');
            return;
        }

        const cohortName = newCohortName.trim().toUpperCase();

        setCreatingCohort(true);
        const result = await studentAPI.addCohort(cohortName);

        if (result.success) {
            await showSuccess(`✅ Cohort ${cohortName} created successfully!`, 'Cohort Created');
            await loadCohorts(); // Reload cohorts list
            setSourceSheet(cohortName); // Select the new cohort
            setShowNewCohortInput(false);
            setNewCohortName('');
        } else {
            await showError(`Failed to create cohort: ${result.error}`, 'Creation Failed');
        }
        setCreatingCohort(false);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            await showWarning('Please select a file first', 'No File Selected');
            return;
        }

        const confirmed = await showConfirm(
            `Import students from "${selectedFile.name}" as ${sourceSheet}?`,
            'Confirm Import'
        );

        if (!confirmed) {
            return;
        }

        setImporting(true);

        try {
            const result = await studentAPI.importFile(selectedFile.path, sourceSheet);

            if (result.success) {
                await showSuccess(
                    `✅ Successfully imported ${result.imported} students!\n\nTotal students: ${result.total}`,
                    'Import Successful'
                );

                navigate('/records', {
                    state: { refresh: Date.now() }
                });
            } else {
                await showError('Failed to import: ' + result.error, 'Import Failed');
            }
        } catch (error) {
            await showError('Import error: ' + error.message, 'Import Error');
        } finally {
            setImporting(false);
        }
    };

    const handleBack = () => {
        navigate('/records', {
            state: { fromImport: true }
        });
    };

    const isFormDisabled = importing || creatingCohort || isSelectingFile;

    return (
        <div className="import-page">
            <button 
                className="btn-back" 
                onClick={handleBack}
                disabled={isFormDisabled}
            >
                ← Back
            </button>

            <div className="import-container">
                <h1>📥 Import Students from Excel</h1>

                {/* Import Status Banner */}
                {importing && (
                    <div className="status-banner" style={{
                        padding: '15px 20px',
                        backgroundColor: '#dbeafe',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div className="spinner" style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #bfdbfe',
                            borderTop: '3px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <div>
                            <p style={{ margin: 0, color: '#1e40af', fontWeight: '600', fontSize: '16px' }}>
                                📥 Importing students...
                            </p>
                            <p style={{ margin: '4px 0 0 0', color: '#3b82f6', fontSize: '14px' }}>
                                This may take a moment. Please wait.
                            </p>
                        </div>
                    </div>
                )}

                <div className="import-instructions">
                    <h3>Instructions:</h3>
                    <ol>
                        <li>Prepare your Excel file with student data</li>
                        <li>Make sure it has columns matching the required fields</li>
                        <li>Click "Browse" to select the file</li>
                        <li>Choose the source cohort or create a new one</li>
                        <li>Click "Import Students"</li>
                        <li><strong>Note:</strong> Student IDs will be auto-generated sequentially</li>
                    </ol>
                </div>

                <div className="import-form">
                    <div className="form-section">
                        <h3>1. Select Excel File</h3>

                        <button
                            onClick={getFilePath}
                            className="file-select-button"
                            disabled={isFormDisabled}
                            style={{
                                opacity: isFormDisabled ? 0.6 : 1,
                                cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSelectingFile ? (
                                <>
                                    <div className="btn-spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    Opening File Browser...
                                </>
                            ) : (
                                <>📁 Browse for Excel File</>
                            )}
                        </button>

                        {selectedFile && (
                            <p className="selected-file">
                                ✅ Selected: {selectedFile.name}
                            </p>
                        )}
                    </div>

                    <div className="form-section">
                        <h3>2. Select Source Cohort</h3>
                        
                        {isLoadingCohorts ? (
                            <div style={{ 
                                padding: '15px', 
                                textAlign: 'center',
                                color: '#666',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                marginTop: '10px'
                            }}>
                                <div className="spinner" style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '3px solid #e5e7eb',
                                    borderTop: '3px solid #3b82f6',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 8px'
                                }}></div>
                                Loading cohorts...
                            </div>
                        ) : (
                            <>
                                <div className="radio-group">
                                    {availableCohorts.map(cohort => (
                                        <label key={cohort} className="radio-option">
                                            <input
                                                type="radio"
                                                value={cohort}
                                                checked={sourceSheet === cohort}
                                                onChange={(e) => setSourceSheet(e.target.value)}
                                                disabled={isFormDisabled}
                                            />
                                            <span>{cohort}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Add New Cohort Button */}
                                {!showNewCohortInput && (
                                    <button
                                        onClick={() => setShowNewCohortInput(true)}
                                        className="btn-add-cohort"
                                        disabled={isFormDisabled}
                                        style={{
                                            marginTop: '10px',
                                            padding: '8px 16px',
                                            backgroundColor: isFormDisabled ? '#9ca3af' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            opacity: isFormDisabled ? 0.6 : 1
                                        }}
                                    >
                                        ➕ Add New Cohort
                                    </button>
                                )}

                                {/* New Cohort Input */}
                                {showNewCohortInput && (
                                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#047857' }}>
                                            Create New Cohort:
                                        </label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                value={newCohortName}
                                                onChange={(e) => setNewCohortName(e.target.value)}
                                                placeholder="e.g., C4, C5"
                                                disabled={isFormDisabled}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    opacity: isFormDisabled ? 0.6 : 1
                                                }}
                                            />
                                            <button
                                                onClick={handleAddCohort}
                                                disabled={isFormDisabled}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: isFormDisabled ? '#9ca3af' : '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                                                    fontSize: '14px',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                {creatingCohort ? (
                                                    <>
                                                        <div className="btn-spinner" style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            border: '2px solid #ffffff',
                                                            borderTop: '2px solid transparent',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite'
                                                        }}></div>
                                                        Creating...
                                                    </>
                                                ) : (
                                                    '✅ Create'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowNewCohortInput(false);
                                                    setNewCohortName('');
                                                }}
                                                disabled={isFormDisabled}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: isFormDisabled ? '#9ca3af' : '#6b7280',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ✖ Cancel
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#047857', marginTop: '8px' }}>
                                            💡 Format: C followed by a number (e.g., C4, C5, C10)
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                            💡 Student IDs will be generated automatically (e.g., UGO_C1_274, UGO_C2_275)
                        </p>
                    </div>

                    <button
                        className="btn-import"
                        onClick={handleImport}
                        disabled={!selectedFile || isFormDisabled}
                        style={{
                            opacity: (!selectedFile || isFormDisabled) ? 0.6 : 1,
                            cursor: (!selectedFile || isFormDisabled) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {importing ? (
                            <>
                                <div className="btn-spinner" style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid #ffffff',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }}></div>
                                Importing...
                            </>
                        ) : (
                            '📥 Import Students'
                        )}
                    </button>
                </div>
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

export default ImportStudents;