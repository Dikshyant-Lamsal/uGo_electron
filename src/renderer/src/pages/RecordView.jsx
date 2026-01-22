/* eslint-disable prettier/prettier */
import { useParams, useNavigate } from "react-router-dom";
import { sampleStudents } from "./sampleData";
import Header from "../components/Header";
import Photo from "../components/Photo";

export default function RecordView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const student = sampleStudents.find((s) => s.id === Number.parseInt(id));
    
    if (!student) {
        return <div className="not-found">Student not found</div>;
    }
    
    const sections = {
        "Personal Information": ["Student_ID", "Full_Name", "District", "Address", "Contact_Number"],
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
        ],
        "Participation & Other": ["Participation", "Source_Sheet"]
    };

    const handlePrint = () => {
        // Simple browser print - hides header and back button
        window.print();
    };
    
    return (
        <div className="record-view">
            <Header />
            <div className="record-view-header no-print">
                <div className="header-actions-row">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <button className="btn-print-profile" onClick={handlePrint}>
                        🖨️ Print Profile
                    </button>
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
                            student[field] != null && (
                                <div key={field} className="record-field">
                                    <span className="field-label">{field.replace(/_/g, ' ')}:</span>
                                    <span className="field-value">{student[field]}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
                <div className="photo-container">
                    <Photo studentId={student.id} studentName={student.Full_Name} />
                </div>
            </div>
            
            {/* All other sections */}
            {Object.entries(sections).slice(1).map(([sectionTitle, fields]) => (
                <div key={sectionTitle} className="record-section">
                    <h2 className="record-section-title">{sectionTitle}</h2>
                    <div className="record-fields">
                        {fields.map((field) => (
                            student[field] != null && (
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