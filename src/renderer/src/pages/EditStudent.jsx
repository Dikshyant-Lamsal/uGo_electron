/* eslint-disable prettier/prettier */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import { sampleStudents } from "./sampleData";

function EditStudent() {
    const navigate = useNavigate();
    const { id } = useParams();
    const student = sampleStudents.find((s) => s.id === Number.parseInt(id));

    const [formData, setFormData] = useState({
        Full_Name: "",
        District: "",
        Address: "",
        Contact_Number: "",
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

    // Load student data on mount
    useEffect(() => {
        if (student) {
            setFormData({
                Full_Name: student.Full_Name || "",
                District: student.District || "",
                Address: student.Address || "",
                Contact_Number: student.Contact_Number || "",
                Program: student.Program || "",
                College: student.College || "",
                Current_Year: student.Current_Year || "",
                Program_Structure: student.Program_Structure || "",
                Scholarship_Type: student.Scholarship_Type || "",
                Scholarship_Percentage: student.Scholarship_Percentage || "",
                Scholarship_Starting_Year: student.Scholarship_Starting_Year || "",
                Scholarship_Status: student.Scholarship_Status || "",
                Total_College_Fee: student.Total_College_Fee || "",
                Total_Scholarship_Amount: student.Total_Scholarship_Amount || "",
                Total_Amount_Paid: student.Total_Amount_Paid || "",
                Total_Due: student.Total_Due || "",
                Books_Total: student.Books_Total || "",
                Uniform_Total: student.Uniform_Total || "",
                Year_1_Fee: student.Year_1_Fee || "",
                Year_1_Payment: student.Year_1_Payment || "",
                Year_2_Fee: student.Year_2_Fee || "",
                Year_2_Payment: student.Year_2_Payment || "",
                Year_3_Fee: student.Year_3_Fee || "",
                Year_3_Payment: student.Year_3_Payment || "",
                Year_4_Fee: student.Year_4_Fee || "",
                Year_4_Payment: student.Year_4_Payment || "",
                Year_1_GPA: student.Year_1_GPA || "",
                Year_2_GPA: student.Year_2_GPA || "",
                Year_3_GPA: student.Year_3_GPA || "",
                Year_4_GPA: student.Year_4_GPA || "",
                Overall_Status: student.Overall_Status || "",
                Participation: student.Participation || "",
                Remarks: student.Remarks || "",
                Source_Sheet: student.Source_Sheet || ""
            });
        }
    }, [student]);

    if (!student) {
        return (
            <div>
                <Header />
                <div className="not-found">Student not found</div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.Full_Name.trim()) {
            alert("Full Name is required!");
            return;
        }

        try {
            // In real app, make API call here
            const response = await fetch(`/api/students/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(`Student "${formData.Full_Name}" updated successfully!`);
                navigate(`/records/${id}`);
            } else {
                alert('Failed to update student');
            }
        } catch (error) {
            console.error('Update error:', error);
            // For now, just show success since we're using sample data
            alert(`Student "${formData.Full_Name}" would be updated in real app!`);
            navigate(`/records/${id}`);
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
                { name: "Participation", label: "Participation", type: "text" },
                { name: "Remarks", label: "Remarks", type: "text" }
            ]
        }
    ];

    return (
        <div className="add-student-page">
            <Header />
            <div className="add-student-container">
                <div className="add-student-header">
                    <h1 className="add-student-title">Edit Student</h1>
                    <p className="add-student-subtitle">Update student information for {student.Full_Name}</p>
                </div>

                <div className="source-sheet-display">
                    <span className="source-sheet-badge">Source Cohort: {formData.Source_Sheet}</span>
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
                            Save Changes
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

export default EditStudent;