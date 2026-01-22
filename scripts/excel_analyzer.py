"""
Excel Database Analyzer
Analyzes the students.xlsx file and outputs all structure information
"""

import pandas as pd
import os
from datetime import datetime

class ExcelAnalyzer:
    def __init__(self, file_path=None):
        # If no path provided, construct relative to script location
        if file_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)  # Go up one level from scripts/
            file_path = os.path.join(project_root, "data", "students.xlsx")
        
        self.file_path = file_path
        self.analysis = {}
        
    def analyze(self):
        """Analyze the Excel file and generate comprehensive report"""
        print("=" * 80)
        print("📊 EXCEL DATABASE ANALYSIS REPORT")
        print("=" * 80)
        print(f"File: {self.file_path}")
        print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        if not os.path.exists(self.file_path):
            print(f"\n❌ ERROR: File not found at {self.file_path}")
            return False
        
        try:
            # Load Excel file
            excel_file = pd.ExcelFile(self.file_path)
            sheet_names = excel_file.sheet_names
            
            print(f"\n📋 Total Sheets Found: {len(sheet_names)}")
            print(f"Sheet Names: {', '.join(sheet_names)}\n")
            
            # Analyze each sheet
            for sheet_name in sheet_names:
                print("\n" + "─" * 80)
                print(f"📄 SHEET: {sheet_name}")
                print("─" * 80)
                
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                
                # Basic info
                print(f"Total Rows: {len(df)}")
                print(f"Total Columns: {len(df.columns)}")
                print(f"Non-empty Rows: {df.dropna(how='all').shape[0]}")
                
                # Column details
                print(f"\n📝 COLUMNS ({len(df.columns)} total):")
                print("-" * 80)
                
                for i, col in enumerate(df.columns, 1):
                    # Clean column name
                    col_clean = str(col).strip()
                    
                    # Get column statistics
                    non_null = df[col].notna().sum()
                    null_count = df[col].isna().sum()
                    unique_values = df[col].nunique()
                    
                    # Get data type
                    dtype = df[col].dtype
                    
                    # Sample values (first 3 non-null)
                    sample_values = df[col].dropna().head(3).tolist()
                    sample_str = ", ".join([str(v)[:30] for v in sample_values])
                    
                    print(f"{i:3d}. {col_clean}")
                    print(f"     Type: {dtype}")
                    print(f"     Non-null: {non_null}/{len(df)} ({(non_null/len(df)*100):.1f}%)")
                    print(f"     Unique values: {unique_values}")
                    if sample_values:
                        print(f"     Sample: {sample_str}")
                    print()
                
                # Store analysis
                self.analysis[sheet_name] = {
                    'total_rows': len(df),
                    'non_empty_rows': df.dropna(how='all').shape[0],
                    'total_columns': len(df.columns),
                    'columns': df.columns.tolist(),
                    'dtypes': df.dtypes.to_dict()
                }
                
                # Check for 'id' column
                has_id = 'id' in [str(c).strip().lower() for c in df.columns]
                print(f"{'✅' if has_id else '❌'} Has 'id' column: {has_id}")
                
                # If Master_Database, show more stats
                if sheet_name == 'Master_Database':
                    print("\n📊 MASTER DATABASE SPECIAL ANALYSIS:")
                    print("-" * 80)
                    
                    # Look for key identifier columns
                    potential_ids = ['id', 'Student_ID', 'Student ID', 'student_id']
                    for id_col in potential_ids:
                        matching_cols = [c for c in df.columns if str(c).strip().lower() == id_col.lower()]
                        if matching_cols:
                            col = matching_cols[0]
                            print(f"Found identifier: '{col}'")
                            print(f"  Unique values: {df[col].nunique()}")
                            print(f"  Sample values: {df[col].head(5).tolist()}")
                    
                    # Check for common fields
                    common_fields = {
                        'Name': ['Full_Name', 'Full Name', 'Name', 'Scholar Name', 'Scholar  Name'],
                        'District': ['District'],
                        'College': ['College', 'College Name', ' College Name '],
                        'Program': ['Program'],
                        'Source': ['Source_Sheet', 'Source Sheet', 'Cohort']
                    }
                    
                    print("\n🔍 Key Fields Detection:")
                    for field_type, possible_names in common_fields.items():
                        found = False
                        for possible_name in possible_names:
                            matching = [c for c in df.columns if str(c).strip().lower() == possible_name.lower()]
                            if matching:
                                print(f"  {field_type}: '{matching[0]}' ✅")
                                found = True
                                break
                        if not found:
                            print(f"  {field_type}: Not found ❌")
            
            # Summary
            print("\n" + "=" * 80)
            print("📋 SUMMARY")
            print("=" * 80)
            print(f"Total sheets: {len(sheet_names)}")
            
            if 'Master_Database' in self.analysis:
                master = self.analysis['Master_Database']
                print(f"\nMaster_Database:")
                print(f"  - Students: {master['non_empty_rows']}")
                print(f"  - Columns: {master['total_columns']}")
                print(f"  - Has 'id' column: {'Yes' if 'id' in [str(c).lower() for c in master['columns']] else 'No'}")
            
            print("\n✅ Analysis complete!")
            print("\n" + "=" * 80)
            print("📤 COPY THE OUTPUT ABOVE AND SEND TO CLAUDE")
            print("=" * 80)
            
            # Generate column list for easy copying
            print("\n📝 QUICK COLUMN REFERENCE:")
            print("-" * 80)
            for sheet_name in sheet_names:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                print(f"\n{sheet_name}:")
                print(df.columns.tolist())
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERROR analyzing file: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    analyzer = ExcelAnalyzer()
    analyzer.analyze()