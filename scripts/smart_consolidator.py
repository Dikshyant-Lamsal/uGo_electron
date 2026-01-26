"""
Smart Database Consolidator
Intelligently updates Master_Database with cohort sheet data:
- Updates existing students if found
- Appends new students
- Preserves numeric IDs
- Merges duplicate records by name
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

class SmartConsolidator:
    def __init__(self, file_path=None):
        if file_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            file_path = os.path.join(project_root, "data", "students.xlsx")
        
        self.file_path = file_path
        self.master_columns = [
            'id',  # Numeric ID - FIRST COLUMN
            'Student_ID',
            'Full_Name',
            'Source_Sheet',
            'Cohort',
            'District',
            'Address',
            'Contact_Number',
            'Father_Name',
            'Father_Contact',
            'Mother_Name',
            'Mother_Contact',
            'Program',
            'College',
            'Current_Year',
            'Program_Structure',
            'Scholarship_Type',
            'Scholarship_Percentage',
            'Scholarship_Starting_Year',
            'Scholarship_Status',
            'Remarks',
            'Total_College_Fee',
            'Total_Scholarship_Amount',
            'Total_Amount_Paid',
            'Total_Due',
            'Books_Total',
            'Uniform_Total',
            'Books_Uniform_Total',
            'Year_1_Fee',
            'Year_1_Payment',
            'Year_2_Fee',
            'Year_2_Payment',
            'Year_3_Fee',
            'Year_3_Payment',
            'Year_4_Fee',
            'Year_4_Payment',
            'Year_1_GPA',
            'Year_2_GPA',
            'Year_3_GPA',
            'Year_4_GPA',
            'Overall_Status',
            'Participation',
            'Last_Updated'
        ]
        
        self.cohort_sheets = ['ACC C1', 'ACC C2', 'C1', 'C2', 'C3', 'Database']
        self.existing_master = None
        self.new_records = []
        self.updated_count = 0
        self.added_count = 0
        
    def clean_column_names(self, df):
        """Remove extra spaces and newlines from column names"""
        df.columns = df.columns.str.strip().str.replace('\n', ' ')
        return df
    
    def normalize_name(self, name):
        """Normalize name for comparison"""
        if pd.isna(name) or name == '':
            return ''
        return str(name).strip().lower()
    
    def load_master_database(self):
        """Load existing Master_Database"""
        print("\n📖 Loading existing Master_Database...")
        try:
            df = pd.read_excel(self.file_path, sheet_name='Master_Database')
            df = self.clean_column_names(df)
            
            # Ensure id column exists
            if 'id' not in df.columns:
                print("   ⚠️  No 'id' column found. Creating sequential IDs...")
                df.insert(0, 'id', range(1, len(df) + 1))
            
            print(f"   ✓ Loaded {len(df)} existing students")
            print(f"   ✓ Highest ID: {df['id'].max() if len(df) > 0 else 0}")
            
            self.existing_master = df
            return df
            
        except Exception as e:
            print(f"   ⚠️  Could not load Master_Database: {e}")
            print("   ℹ️  Will create new Master_Database")
            self.existing_master = pd.DataFrame(columns=self.master_columns)
            return self.existing_master
    
    def process_cohort_sheet(self, sheet_name, df):
        """Process a single cohort sheet"""
        df = df.dropna(how='all')
        
        # Determine name column
        name_col = None
        for col in ['Full Name', 'Scholar  Name', 'Scholar Name', 'Full_Name']:
            if col in df.columns:
                name_col = col
                break
        
        if name_col is None:
            print(f"   ⚠️  No name column found in {sheet_name}")
            return []
        
        df = df[df[name_col].notna()]
        
        records = []
        for idx, row in df.iterrows():
            full_name = str(row.get(name_col, '')).strip()
            if not full_name or full_name.lower() in ['nan', '']:
                continue
            
            # Build record based on sheet type
            if sheet_name in ['ACC C1', 'ACC C2', 'Database']:
                record = self.process_acc_database_row(row, sheet_name)
            else:  # C1, C2, C3
                record = self.process_cohort_row(row, sheet_name)
            
            record['Full_Name'] = full_name
            record['Source_Sheet'] = sheet_name
            records.append(record)
        
        return records
    
    def process_acc_database_row(self, row, sheet_name):
        """Process ACC/Database sheet row"""
        return {
            'Student_ID': row.get('Student_ID', ''),
            'Cohort': row.get('Cohort', ''),
            'District': row.get('District', ''),
            'Contact_Number': row.get('Contact', ''),
            'Program': row.get('Program', ''),
            'College': str(row.get(' College Name ', '') or row.get('Name', '')).strip(),
            'Current_Year': row.get('Studying year ', ''),
            'Scholarship_Starting_Year': row.get('U-Go Scholarship starting year', ''),
            'Total_College_Fee': row.get('Total College Fee', ''),
            'Total_Scholarship_Amount': row.get('U-Go Scholarship  (full course)', ''),
            'Year_1_Fee': row.get('1st Year fee', ''),
            'Year_1_Payment': row.get('1st Year Payment', ''),
            'Year_2_Fee': row.get('2nd Year fee', ''),
            'Year_2_Payment': row.get('2nd Year Payment', ''),
            'Year_3_Fee': row.get('3rd Year fee', ''),
            'Year_3_Payment': row.get('3rd Year Payment', ''),
            'Year_4_Fee': row.get('4th Year fee', ''),
            'Year_4_Payment': row.get('4th Year Payment', ''),
            'Total_Amount_Paid': row.get('Total Amount paid ', ''),
            'Total_Due': row.get('Due', ''),
            'Books_Total': row.get('Books', ''),
            'Uniform_Total': row.get('Uniform', ''),
            'Books_Uniform_Total': row.get('Total (Books + Uniform)', ''),
            'Year_1_GPA': row.get('Year 1 GPA', ''),
            'Year_2_GPA': row.get('Year 2 GPA', ''),
            'Year_3_GPA': row.get('Year 3 GPA', ''),
            'Year_4_GPA': row.get('Year 4 Gpa', ''),
            'Overall_Status': row.get('Overall Status', ''),
        }
    
    def process_cohort_row(self, row, sheet_name):
        """Process C1/C2/C3 sheet row"""
        return {
            'District': row.get('District', ''),
            'Address': row.get('Address', ''),
            'Contact_Number': row.get('Contact Number', ''),
            'Father_Name': row.get("Father's Name", row.get('Father_Name', '')),
            'Father_Contact': row.get("Father's Contact", row.get('Father_Contact', '')),
            'Mother_Name': row.get("Mother's Name", row.get('Mother_Name', '')),
            'Mother_Contact': row.get("Mother's Contact", row.get('Mother_Contact', '')),
            'Program': row.get('Program', ''),
            'College': row.get('College', ''),
            'Current_Year': row.get('Current Year', ''),
            'Program_Structure': row.get('Program Structure (Year/Semester)', ''),
            'Scholarship_Type': row.get('Scholarship type ', row.get('Scholarship Type', '')),
            'Scholarship_Percentage': row.get('Scholarship %', ''),
            'Scholarship_Starting_Year': row.get('Scholarship Starting Year', ''),
            'Scholarship_Status': row.get('Scholarship Status', ''),
            'Remarks': row.get('Remarks', ''),
            'Year_1_GPA': row.get('Year 1 GPA', ''),
            'Year_2_GPA': row.get('Year 2 GPA', ''),
            'Year_3_GPA': row.get('Year 3 GPA', ''),
            'Year_4_GPA': row.get('Year 4 Gpa', ''),
            'Overall_Status': row.get('Overall Status', ''),
            'Participation': row.get('Participation in Activities', row.get('Participation ', row.get('Participation', ''))),
        }
    
    def merge_records(self, existing, new_data):
        """Merge new data into existing record, keeping non-null values"""
        merged = existing.copy()
        
        for key, value in new_data.items():
            # Update if:
            # 1. Existing value is null/empty AND new value is not
            # 2. OR it's Source_Sheet (append sources)
            if key == 'Source_Sheet':
                # Combine source sheets
                existing_sources = set(str(merged.get(key, '')).split(', '))
                new_sources = set(str(value).split(', '))
                combined = existing_sources.union(new_sources)
                combined.discard('')
                merged[key] = ', '.join(sorted(combined))
            elif pd.isna(merged.get(key)) or merged.get(key) == '' or str(merged.get(key)).strip() == '':
                if pd.notna(value) and str(value).strip() != '':
                    merged[key] = value
        
        merged['Last_Updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return merged
    
    def consolidate(self):
        """Main consolidation process"""
        print("=" * 80)
        print("🔄 SMART DATABASE CONSOLIDATION")
        print("=" * 80)
        print(f"File: {self.file_path}")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        if not os.path.exists(self.file_path):
            print(f"\n❌ ERROR: File not found at {self.file_path}")
            return False
        
        # Load existing master
        master_df = self.load_master_database()
        max_id = master_df['id'].max() if len(master_df) > 0 else 0
        next_id = max_id + 1
        
        # Create name-to-index mapping for fast lookup
        name_to_idx = {}
        for idx, row in master_df.iterrows():
            normalized = self.normalize_name(row.get('Full_Name', ''))
            if normalized:
                name_to_idx[normalized] = idx
        
        # Process each cohort sheet
        for sheet_name in self.cohort_sheets:
            print(f"\n📊 Processing {sheet_name}...")
            try:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                df = self.clean_column_names(df)
                records = self.process_cohort_sheet(sheet_name, df)
                
                print(f"   ✓ Found {len(records)} students")
                
                # Update or append each record
                for record in records:
                    normalized_name = self.normalize_name(record.get('Full_Name', ''))
                    
                    if normalized_name in name_to_idx:
                        # UPDATE existing student
                        idx = name_to_idx[normalized_name]
                        existing = master_df.loc[idx].to_dict()
                        merged = self.merge_records(existing, record)
                        
                        # Update in dataframe
                        for key, value in merged.items():
                            master_df.at[idx, key] = value
                        
                        self.updated_count += 1
                    else:
                        # APPEND new student
                        record['id'] = next_id
                        record['Last_Updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        
                        # Add to dataframe
                        new_row = pd.DataFrame([record])
                        master_df = pd.concat([master_df, new_row], ignore_index=True)
                        
                        # Add to lookup
                        name_to_idx[normalized_name] = len(master_df) - 1
                        
                        self.added_count += 1
                        next_id += 1
                
            except Exception as e:
                print(f"   ✗ Error processing {sheet_name}: {e}")
        
        # Ensure all master columns exist
        for col in self.master_columns:
            if col not in master_df.columns:
                master_df[col] = ''
        
        # Reorder columns
        master_df = master_df[self.master_columns]
        
        # Fill NaN with empty strings
        master_df = master_df.fillna('')
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 CONSOLIDATION SUMMARY")
        print("=" * 80)
        print(f"Updated existing students: {self.updated_count}")
        print(f"Added new students: {self.added_count}")
        print(f"Total students in Master_Database: {len(master_df)}")
        print(f"ID range: 1 to {master_df['id'].max()}")
        
        # Save
        print("\n💾 Saving Master_Database...")
        self.save_master(master_df)
        
        return True
    
    def save_master(self, master_df):
        """Save updated Master_Database back to Excel"""
        try:
            # Backup original file
            backup_path = self.file_path.replace('.xlsx', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx')
            print(f"   📦 Creating backup: {os.path.basename(backup_path)}")
            
            import shutil
            shutil.copy2(self.file_path, backup_path)
            
            # Load all sheets
            with pd.ExcelFile(self.file_path) as xls:
                all_sheets = {name: pd.read_excel(xls, name) 
                             for name in xls.sheet_names 
                             if name != 'Master_Database'}
            
            # Add updated master
            all_sheets['Master_Database'] = master_df
            
            # Write all sheets
            with pd.ExcelWriter(self.file_path, engine='openpyxl', mode='w') as writer:
                for sheet_name, data in all_sheets.items():
                    data.to_excel(writer, sheet_name=sheet_name, index=False)
            
            print(f"   ✓ Master_Database saved with {len(master_df)} students")
            print(f"   ✓ Backup created: {os.path.basename(backup_path)}")
            
        except Exception as e:
            print(f"   ✗ Error saving: {e}")
            raise


if __name__ == "__main__":
    consolidator = SmartConsolidator()
    
    if consolidator.consolidate():
        print("\n" + "=" * 80)
        print("✅ CONSOLIDATION COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print("\n📝 What happened:")
        print(f"  • Updated {consolidator.updated_count} existing students with new data")
        print(f"  • Added {consolidator.added_count} new students")
        print(f"  • All changes saved to Master_Database")
        print(f"  • Original file backed up")
        print("\n🚀 Your Electron app will automatically see the updates!")
    else:
        print("\n❌ Consolidation failed")