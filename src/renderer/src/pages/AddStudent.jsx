/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import studentAPI from "../api/studentApi";
import { showError, showSuccess, showWarning } from "../utils/dialog";


function AddStudent() {
    const navigate = useNavigate();
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [availableCohorts, setAvailableCohorts] = useState(['C1', 'C2', 'C3']);
    const [showNewCohortInput, setShowNewCohortInput] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [creatingCohort, setCreatingCohort] = useState(false);
    const [isLoadingCohorts, setIsLoadingCohorts] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

    const handleAddCohort = async () => {
        if (!newCohortName.trim()) {
            await showWarning('Please enter a cohort name');
            return;
        }

        if (!/^C\d+$/.test(newCohortName.trim().toUpperCase())) {
            await showWarning('Cohort name must be in format: C4, C5, C6, etc.');
            return;
        }

        const cohortName = newCohortName.trim().toUpperCase();

        setCreatingCohort(true);
        const result = await studentAPI.addCohort(cohortName);

        if (result.success) {
            await showSuccess(`Cohort ${cohortName} created successfully!`);
            await loadCohorts();
            setFormData(prev => ({ ...prev, Source_Sheet: cohortName }));
            setShowNewCohortInput(false);
            setNewCohortName('');
        } else {
            await showError(`Failed to create cohort: ${result.error}`);
        }
        setCreatingCohort(false);
    };

    const handleBack = () => {
        navigate('/records', {
            state: { fromAddStudent: true }
        });
    };


    const [formData, setFormData] = useState({
        Full_Name: "",
        District: "",
        Address: "",
        Contact_Number: "",
        Father_Name: "",
        Father_Contact: "",
        Mother_Name: "",
        Mother_Contact: "",
        Program: "",
        College: "",
        Current_Year: "",
        Program_Structure: "",
        Scholarship_Type: "",
        Scholarship_Percentage: "",
        Scholarship_Starting_Year: "",
        Scholarship_Status: "",
        Total_College_Fee: "",
        Total_Scholarship_Amount: "",
        Total_Amount_Paid: "",
        Total_Due: "",
        Books_Total: "",
        Uniform_Total: "",
        Year_1_Fee: "",
        Year_1_Payment: "",
        Year_2_Fee: "",
        Year_2_Payment: "",
        Year_3_Fee: "",
        Year_3_Payment: "",
        Year_4_Fee: "",
        Year_4_Payment: "",
        Year_1_GPA: "",
        Year_2_GPA: "",
        Year_3_GPA: "",
        Year_4_GPA: "",
        Overall_Status: "",
        Participation: "",
        Remarks: "",
        Source_Sheet: "C1"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showWarning('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showWarning('Image must be smaller than 5MB');
            return;
        }

        setPhotoFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.Full_Name.trim()) {
            await showWarning("Full Name is required!");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await studentAPI.addStudent(formData);

            if (result.success) {
                const newStudent = result.data;

                if (photoFile) {
                    setIsUploadingPhoto(true);
                    const photoResult = await studentAPI.savePhoto(newStudent.id, photoFile);
                    setIsUploadingPhoto(false);
                    
                    if (!photoResult.success) {
                        console.error('Failed to upload photo:', photoResult.error);
                        await showWarning(`Student added, but photo upload failed: ${photoResult.error}`);
                    }
                }

                await showSuccess(`Student "${formData.Full_Name}" added successfully!`);
                navigate("/records");
            } else {
                await showError('Failed to add student: ' + result.error);
            }
        } catch (error) {
            await showError('An unexpected error occurred: ' + error.message);
        } finally {
            setIsSubmitting(false);
            setIsUploadingPhoto(false);
        }
    };

    const formSections = [
        {
            title: "Personal Information",
            fields: [
                { name: "Full_Name", label: "Full Name *", type: "text" },
                { name: "District", label: "District", type: "text" },
                { name: "Address", label: "Address", type: "text" },
                { name: "Contact_Number", label: "Contact Number", type: "text" }
            ]
        },
        {
            title: "Parent/Guardian Information",
            fields: [
                { name: "Father_Name", label: "Father's Name", type: "text" },
                { name: "Father_Contact", label: "Father's Contact", type: "text" },
                { name: "Mother_Name", label: "Mother's Name", type: "text" },
                { name: "Mother_Contact", label: "Mother's Contact", type: "text" }
            ]
        },
        {
            title: "Academic Information",
            fields: [
                { name: "Program", label: "Program", type: "text" },
                { name: "College", label: "College", type: "text" },
                { name: "Current_Year", label: "Current Year", type: "text" },
                { name: "Program_Structure", label: "Program Structure", type: "text" }
            ]
        },
        {
            title: "Scholarship Details",
            fields: [
                { name: "Scholarship_Type", label: "Scholarship Type", type: "text" },
                { name: "Scholarship_Percentage", label: "Scholarship %", type: "text" },
                { name: "Scholarship_Starting_Year", label: "Scholarship Starting Year", type: "text" },
                { name: "Scholarship_Status", label: "Scholarship Status", type: "text" }
            ]
        },
        {
            title: "Financial Information",
            fields: [
                { name: "Total_College_Fee", label: "Total College Fee", type: "number" },
                { name: "Total_Scholarship_Amount", label: "Total Scholarship Amount", type: "number" },
                { name: "Total_Amount_Paid", label: "Total Amount Paid", type: "number" },
                { name: "Total_Due", label: "Total Due", type: "number" },
                { name: "Books_Total", label: "Books Total", type: "number" },
                { name: "Uniform_Total", label: "Uniform Total", type: "number" }
            ]
        },
        {
            title: "Year-wise Fee Details",
            fields: [
                { name: "Year_1_Fee", label: "Year 1 Fee", type: "number" },
                { name: "Year_1_Payment", label: "Year 1 Payment", type: "number" },
                { name: "Year_2_Fee", label: "Year 2 Fee", type: "number" },
                { name: "Year_2_Payment", label: "Year 2 Payment", type: "number" },
                { name: "Year_3_Fee", label: "Year 3 Fee", type: "number" },
                { name: "Year_3_Payment", label: "Year 3 Payment", type: "number" },
                { name: "Year_4_Fee", label: "Year 4 Fee", type: "number" },
                { name: "Year_4_Payment", label: "Year 4 Payment", type: "number" }
            ]
        },
        {
            title: "Academic Performance",
            fields: [
                { name: "Year_1_GPA", label: "Year 1 GPA", type: "text" },
                { name: "Year_2_GPA", label: "Year 2 GPA", type: "text" },
                { name: "Year_3_GPA", label: "Year 3 GPA", type: "text" },
                { name: "Year_4_GPA", label: "Year 4 GPA", type: "text" },
                { name: "Overall_Status", label: "Overall Status", type: "text" }
            ]
        },
        {
            title: "Additional Information",
            fields: [
                { name: "Participation", label: "Participation (Legacy)", type: "text" },
                { name: "Remarks", label: "Remarks", type: "text" }
            ]
        }
    ];

    const isFormDisabled = isSubmitting || isUploadingPhoto || creatingCohort;

    return (
        <div className="add-student-page">
            <button 
                className="btn-back" 
                onClick={handleBack}
                disabled={isFormDisabled}
            >
                ← Back
            </button>
            <div className="add-student-container">
                <div className="add-student-header">
                    <h1 className="add-student-title">Add New Student</h1>
                    <p className="add-student-subtitle">Fill in the student information below</p>
                </div>

                {/* Loading/Submission Status Banner */}
                {(isSubmitting || isUploadingPhoto) && (
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
                            width: '20px',
                            height: '20px',
                            border: '3px solid #bfdbfe',
                            borderTop: '3px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ margin: 0, color: '#1e40af', fontWeight: '500' }}>
                            {isUploadingPhoto ? '📸 Uploading student photo...' : '💾 Saving student data...'}
                        </p>
                    </div>
                )}

                {/* Info Banner */}
                <div className="info-banner">
                    <p>ℹ️ <strong>Note:</strong> You can add event participations after saving the student record.</p>
                </div>

                <div className="source-sheet-selector">
                    <label className="source-sheet-label">Source Cohort:</label>
                    
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
                                            name="Source_Sheet"
                                            value={cohort}
                                            checked={formData.Source_Sheet === cohort}
                                            onChange={handleChange}
                                            disabled={isFormDisabled}
                                        />
                                        <span>{cohort}</span>
                                    </label>
                                ))}
                            </div>

                            {!showNewCohortInput && (
                                <button
                                    type="button"
                                    onClick={() => setShowNewCohortInput(true)}
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
                                                opacity: isFormDisabled ? 0.6 : 1
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCohort}
                                            disabled={isFormDisabled}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: isFormDisabled ? '#9ca3af' : '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: isFormDisabled ? 'not-allowed' : 'pointer',
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
                                                <>✅ Create</>
                                            )}
                                        </button>
                                        <button
                                            type="button"
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
                                                cursor: isFormDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            ✖
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        💡 Student ID will be auto-generated (e.g., UGO_C1_274)
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="add-student-form">
                    {formSections.map((section, idx) => (
                        <div key={idx} className="form-section">
                            <h2 className="form-section-title">{section.title}</h2>
                            <div className="form-fields-grid">
                                {section.fields.map(field => (
                                    <div key={field.name} className="form-field">
                                        <label className="form-label">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder={`Enter ${field.label.replace(' *', '')}`}
                                            disabled={isFormDisabled}
                                            style={{
                                                opacity: isFormDisabled ? 0.6 : 1,
                                                cursor: isFormDisabled ? 'not-allowed' : 'text'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={isFormDisabled}
                            style={{
                                opacity: isFormDisabled ? 0.6 : 1,
                                cursor: isFormDisabled ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting || isUploadingPhoto ? (
                                <>
                                    <div className="btn-spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    {isUploadingPhoto ? 'Uploading Photo...' : 'Saving...'}
                                </>
                            ) : (
                                'Save Student'
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleBack}
                            disabled={isFormDisabled}
                            style={{
                                opacity: isFormDisabled ? 0.6 : 1,
                                cursor: isFormDisabled ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
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

export default AddStudent;