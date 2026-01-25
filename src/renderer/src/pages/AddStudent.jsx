/* eslint-disable prettier/prettier */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import studentAPI from "../api/studentApi";

function AddStudent() {
    const navigate = useNavigate();
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

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
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be smaller than 5MB');
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
            alert("Full Name is required!");
            return;
        }

        const result = await studentAPI.addStudent(formData);

        if (result.success) {
            const newStudent = result.data;

            if (photoFile) {
                const photoResult = await studentAPI.savePhoto(newStudent.id, photoFile);
                if (!photoResult.success) {
                    console.error('Failed to upload photo:', photoResult.error);
                    alert(`Student added, but photo upload failed: ${photoResult.error}`);
                }
            }

            alert(`Student "${formData.Full_Name}" added successfully!`);

            // ✅ Option: Navigate to edit page so they can add participations
            if (window.confirm('Would you like to add participations for this student now?')) {
                navigate(`/records/${newStudent.id}/edit`);
            } else {
                navigate("/records");
            }
        } else {
            alert('Failed to add student: ' + result.error);
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

    return (
        <div className="add-student-page">
            <Header />
            <button className="btn-back" onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className="add-student-container">
                <div className="add-student-header">
                    <h1 className="add-student-title">Add New Student</h1>
                    <p className="add-student-subtitle">Fill in the student information below</p>
                </div>

                {/* ✅ ADD INFO BANNER */}
                <div className="info-banner">
                    <p>ℹ️ <strong>Note:</strong> You can add event participations after saving the student record.</p>
                </div>

                <div className="source-sheet-selector">
                    <label className="source-sheet-label">Source Cohort:</label>
                    <div className="radio-group">
                        {["C1", "C2", "C3", "ACC C1", "ACC C2"].map(cohort => (
                            <label key={cohort} className="radio-option">
                                <input
                                    type="radio"
                                    name="Source_Sheet"
                                    value={cohort}
                                    checked={formData.Source_Sheet === cohort}
                                    onChange={handleChange}
                                />
                                <span>{cohort}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="form-section-title">📷 Student Photo (Optional)</h2>
                    <div className="photo-upload-section">
                        <div className="photo-upload-preview">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="student-photo"
                                />
                            ) : (
                                <div className="photo-placeholder">
                                    No photo selected
                                </div>
                            )}
                        </div>
                        <div className="photo-upload-controls">
                            <label className="btn-upload-photo">
                                📷 Select Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {photoFile && (
                                <button
                                    type="button"
                                    className="btn-remove-photo"
                                    onClick={() => {
                                        setPhotoFile(null);
                                        setPhotoPreview(null);
                                    }}
                                >
                                    ✖ Remove
                                </button>
                            )}
                            <p className="photo-upload-hint">
                                JPG, PNG, or GIF • Max 5MB
                            </p>
                        </div>
                    </div>
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
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">
                            Save Student
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddStudent;