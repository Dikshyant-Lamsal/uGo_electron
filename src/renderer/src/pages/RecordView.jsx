/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Photo from "../components/Photo";
import ParticipationsList from "../components/ParticipationsList";
import studentAPI from "../api/studentApi";

export default function RecordView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showParticipations, setShowParticipations] = useState(true);
    const [photoKey, setPhotoKey] = useState(0); // ✅ Key to force photo refresh
    const [savingPdf, setSavingPdf] = useState(false);
    // Fetch student data on mount
    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);
            const result = await studentAPI.getStudent(parseInt(id));

            if (result.success) {
                setStudent(result.data);
            } else {
                console.error('Failed to fetch student:', result.error);
            }

            setLoading(false);
        };

        fetchStudent();
    }, [id]);

    const sections = {
        "Personal Information": ["Student_ID", "Full_Name", "District", "Address", "Contact_Number"],
        "Parent/Guardian Information": ["Father_Name", "Father_Contact", "Mother_Name", "Mother_Contact"],
        "Academic Information": ["Program", "College", "Current_Year", "Program_Structure"],
        "Scholarship Details": [
            "Scholarship_Type",
            "Scholarship_Percentage",
            "Scholarship_Starting_Year",
            "Scholarship_Status",
            "Remarks"
        ],
        "Financial Summary": [
            "Total_College_Fee",
            "Total_Scholarship_Amount",
            "Total_Amount_Paid",
            "Total_Due",
            "Books_Total",
            "Uniform_Total"
        ],
        "Year-wise Fee Details": [
            "Year_1_Fee",
            "Year_1_Payment",
            "Year_2_Fee",
            "Year_2_Payment",
            "Year_3_Fee",
            "Year_3_Payment",
            "Year_4_Fee",
            "Year_4_Payment"
        ],
        "Academic Performance": [
            "Year_1_GPA",
            "Year_2_GPA",
            "Year_3_GPA",
            "Year_4_GPA",
            "Overall_Status"
        ]
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSavePDF = async () => {
        setSavingPdf(true);

        try {
            const htmlContent = generatePDFContent();
            const defaultFileName = `${student.Full_Name.replace(/\s+/g, '_')}_Profile.pdf`;

            const result = await studentAPI.saveStudentPDF(htmlContent, defaultFileName);

            if (result.success) {
                alert(`✅ PDF saved successfully to:\n${result.filePath}`);
            } else if (!result.canceled) {
                alert(`❌ Failed to save PDF: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving PDF:', error);
            alert('❌ Failed to save PDF. Please try again.');
        } finally {
            setSavingPdf(false);
        }
    };


    const generatePDFContent = () => {
        const photoUrl = document.querySelector('.student-photo')?.src || '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${student.Full_Name} - Student Profile</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        padding: 40px;
                        color: #2c3e50;
                        background: white;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #3498db;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        font-size: 24px;
                        color: #2c3e50;
                        margin-bottom: 5px;
                    }
                    .header p {
                        font-size: 12px;
                        color: #7f8c8d;
                    }
                    .student-name {
                        font-size: 28px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-bottom: 30px;
                        text-align: center;
                    }
                    .personal-info-section {
                        display: flex;
                        gap: 30px;
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    .student-photo-container {
                        flex-shrink: 0;
                    }
                    .student-photo {
                        width: 150px;
                        height: 150px;
                        object-fit: cover;
                        border: 3px solid #3498db;
                        border-radius: 8px;
                    }
                    .photo-placeholder {
                        width: 150px;
                        height: 150px;
                        border: 3px solid #bdc3c7;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #ecf0f1;
                        color: #7f8c8d;
                        font-size: 14px;
                    }
                    .section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                        border: 1px solid #ecf0f1;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 8px;
                        margin-bottom: 15px;
                    }
                    .fields {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                    .field {
                        display: flex;
                        font-size: 14px;
                    }
                    .field-label {
                        font-weight: 600;
                        min-width: 180px;
                        color: #2c3e50;
                    }
                    .field-value {
                        color: #34495e;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #ecf0f1;
                        text-align: center;
                        font-size: 10px;
                        color: #95a5a6;
                    }
                    @media print {
                        body { margin: 0; padding: 20mm; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>U-Go Scholarship - Student Profile</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>

                <div class="student-name">${student.Full_Name}</div>

                <div class="personal-info-section">
                    <div style="flex: 1;">
                        <div class="section-title">Personal Information</div>
                        <div class="fields">
                            ${generateFields(sections["Personal Information"])}
                        </div>
                    </div>
                    <div class="student-photo-container">
                        ${photoUrl ?
                `<img src="${photoUrl}" class="student-photo" alt="${student.Full_Name}" />` :
                `<div class="photo-placeholder">No Photo</div>`
            }
                    </div>
                </div>

                ${Object.entries(sections).slice(1).map(([title, fields]) => `
                    <div class="section">
                        <div class="section-title">${title}</div>
                        <div class="fields">
                            ${generateFields(fields)}
                        </div>
                    </div>
                `).join('')}

                <div class="footer">
                    <p>U-Go Scholarship Management System</p>
                    <p>This is an official student record</p>
                </div>
            </body>
            </html>
        `;
    };

    const generateFields = (fields) => {
        return fields
            .filter(field => student[field] != null && student[field] !== '')
            .map(field => `
                <div class="field">
                    <span class="field-label">${field.replace(/_/g, ' ')}:</span>
                    <span class="field-value">${student[field]}</span>
                </div>
            `)
            .join('');
    };

    // ✅ Callback when photo changes
    const handlePhotoChange = () => {
        // Force photo component to re-render
        setPhotoKey(prev => prev + 1);
    };

    // Loading state
    if (loading) {
        return (
            <div className="record-view">
                <Header />
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading student data...</p>
                </div>
            </div>
        );
    }

    // Student not found
    if (!student) {
        return (
            <div className="record-view">
                <Header />
                <div className="not-found">Student not found</div>
            </div>
        );
    }

    return (
        <div className="record-view">
            <Header />
            <div className="record-view-header no-print">
                <div className="header-actions-row">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn-edit"
                            onClick={() => navigate(`/edit/${id}`)}
                        >
                            ✏️ Edit Student
                        </button>
                        {/* ✅ Updated buttons */}
                        <button
                            className="btn-save-pdf"
                            onClick={handleSavePDF}
                            disabled={savingPdf}
                        >
                            {savingPdf ? '⏳ Saving...' : '🖨️ Print'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Header - Only visible when printing */}
            <div className="print-only print-header">
                <h1>U-Go Scholarship - Student Profile</h1>
                <p>Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            <h1 className="record-view-title">{student.Full_Name}</h1>

            {/* Personal Information with Photo */}
            <div className="personal-info-wrapper">
                <div className="personal-info-content">
                    <h2 className="record-section-title">Personal Information</h2>
                    <div className="record-fields">
                        {sections["Personal Information"].map((field) => (
                            student[field] != null && student[field] !== '' && (
                                <div key={field} className="record-field">
                                    <span className="field-label">{field.replace(/_/g, ' ')}:</span>
                                    <span className="field-value">{student[field]}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
                <div className="photo-container">
                    {/* ✅ Enable editing and add callback */}
                    <Photo
                        key={photoKey}
                        studentId={student.id}
                        studentName={student.Full_Name}
                        editable={true}
                        onPhotoChange={handlePhotoChange}
                    />
                </div>
            </div>

            {/* ✅ PARTICIPATIONS SECTION - Before other sections */}
            <div className="record-section participations-section-wrapper no-print">
                <div className="participations-section-header">
                    <h2 className="record-section-title">📋 Event Participations</h2>
                    <button
                        className="btn-toggle-participations"
                        onClick={() => setShowParticipations(!showParticipations)}
                    >
                        {showParticipations ? '▼ Hide' : '▶ Show'}
                    </button>
                </div>
                {showParticipations && (
                    <ParticipationsList studentId={parseInt(id)} />
                )}
            </div>

            {/* All other sections */}
            {Object.entries(sections).slice(1).map(([sectionTitle, fields]) => (
                <div key={sectionTitle} className="record-section">
                    <h2 className="record-section-title">{sectionTitle}</h2>
                    <div className="record-fields">
                        {fields.map((field) => (
                            student[field] != null && student[field] !== '' && (
                                <div key={field} className="record-field">
                                    <span className="field-label">{field.replace(/_/g, ' ')}:</span>
                                    <span className="field-value">{student[field]}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            ))}

            {/* Print Footer - Only visible when printing */}
            <div className="print-only print-footer">
                <p>U-Go Scholarship Management System</p>
                <p>This is an official student record</p>
            </div>
        </div>
    );
}