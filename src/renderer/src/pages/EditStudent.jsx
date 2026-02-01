/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Photo from "../components/Photo";
import ParticipationsList from "../components/ParticipationsList";
import studentAPI from "../api/studentApi";
import { showWarning, showSuccess, showError } from "../utils/dialog";

function EditStudent() {
    const navigate = useNavigate();
    const { id } = useParams();

    const handleBack = () => {
        navigate('/records', {
            state: { fromStudentDetail: true }
        });
    };
    
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photoKey, setPhotoKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        Source_Sheet: ""
    });

    // Fetch student data on mount
    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);
            const result = await studentAPI.getStudent(parseInt(id));

            if (result.success) {
                const studentData = result.data;
                setStudent(studentData);

                // Populate form with student data
                setFormData({
                    Full_Name: studentData.Full_Name || "",
                    District: studentData.District || "",
                    Address: studentData.Address || "",
                    Contact_Number: studentData.Contact_Number || "",
                    Father_Name: studentData.Father_Name || "",
                    Father_Contact: studentData.Father_Contact || "",
                    Mother_Name: studentData.Mother_Name || "",
                    Mother_Contact: studentData.Mother_Contact || "",
                    Program: studentData.Program || "",
                    College: studentData.College || "",
                    Current_Year: studentData.Current_Year || "",
                    Program_Structure: studentData.Program_Structure || "",
                    Scholarship_Type: studentData.Scholarship_Type || "",
                    Scholarship_Percentage: studentData.Scholarship_Percentage || "",
                    Scholarship_Starting_Year: studentData.Scholarship_Starting_Year || "",
                    Scholarship_Status: studentData.Scholarship_Status || "",
                    Total_College_Fee: studentData.Total_College_Fee || "",
                    Total_Scholarship_Amount: studentData.Total_Scholarship_Amount || "",
                    Total_Amount_Paid: studentData.Total_Amount_Paid || "",
                    Total_Due: studentData.Total_Due || "",
                    Books_Total: studentData.Books_Total || "",
                    Uniform_Total: studentData.Uniform_Total || "",
                    Year_1_Fee: studentData.Year_1_Fee || "",
                    Year_1_Payment: studentData.Year_1_Payment || "",
                    Year_2_Fee: studentData.Year_2_Fee || "",
                    Year_2_Payment: studentData.Year_2_Payment || "",
                    Year_3_Fee: studentData.Year_3_Fee || "",
                    Year_3_Payment: studentData.Year_3_Payment || "",
                    Year_4_Fee: studentData.Year_4_Fee || "",
                    Year_4_Payment: studentData.Year_4_Payment || "",
                    Year_1_GPA: studentData.Year_1_GPA || "",
                    Year_2_GPA: studentData.Year_2_GPA || "",
                    Year_3_GPA: studentData.Year_3_GPA || "",
                    Year_4_GPA: studentData.Year_4_GPA || "",
                    Overall_Status: studentData.Overall_Status || "",
                    Participation: studentData.Participation || "",
                    Remarks: studentData.Remarks || "",
                    Source_Sheet: studentData.Source_Sheet || ""
                });
            } else {
                await showError('Failed to load student: ' + result.error, 'Load Error');
            }

            setLoading(false);
        };

        fetchStudent();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = () => {
        setPhotoKey(prev => prev + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.Full_Name.trim()) {
            await showWarning("Full Name is required!", "Missing Required Field");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await studentAPI.updateStudent(parseInt(id), formData);

            if (result.success) {
                await showSuccess(
                    `Student "${formData.Full_Name}" updated successfully!`,
                    'Update Successful'
                );
                navigate(`/records/${id}`);
            } else {
                await showError('Failed to update student: ' + result.error, 'Update Failed');
            }
        } catch (error) {
            await showError('An unexpected error occurred: ' + error.message, 'Update Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Header />
                <div className="add-student-container">
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
                        <p style={{ color: '#666', fontSize: '16px' }}>Loading student data...</p>
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

    if (!student) {
        return (
            <div>
                <div className="not-found">Student not found</div>
            </div>
        );
    }

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

    return (
        <div className="add-student-page">
            <button 
                className="btn-back" 
                onClick={handleBack}
                disabled={isSubmitting}
            >
                ← Back
            </button>
            <div className="add-student-container">
                <div className="add-student-header">
                    <h1 className="add-student-title">Edit Student</h1>
                    <p className="add-student-subtitle">Update student information for {student.Full_Name}</p>
                </div>

                {/* Submission Status Banner */}
                {isSubmitting && (
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
                            💾 Saving changes...
                        </p>
                    </div>
                )}

                <div className="source-sheet-display">
                    <span className="source-sheet-badge">Source Cohort: {formData.Source_Sheet}</span>
                </div>

                {/* Student Photo */}
                <div className="form-section">
                    <h2 className="form-section-title">📷 Student Photo</h2>
                    <div className="photo-upload-section" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                        <Photo
                            key={photoKey}
                            studentId={student.id}
                            studentID={student.Student_ID}
                            studentName={student.Full_Name}
                            editable={!isSubmitting}
                            onPhotoChange={handlePhotoChange}
                        />
                    </div>
                </div>

                {/* Participations Section */}
                <ParticipationsList studentId={parseInt(id)} />

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
                                            disabled={isSubmitting}
                                            style={{
                                                opacity: isSubmitting ? 0.6 : 1,
                                                cursor: isSubmitting ? 'not-allowed' : 'text'
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
                            disabled={isSubmitting}
                            style={{
                                opacity: isSubmitting ? 0.6 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="btn-spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    Saving Changes...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                            style={{
                                opacity: isSubmitting ? 0.6 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
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

export default EditStudent;