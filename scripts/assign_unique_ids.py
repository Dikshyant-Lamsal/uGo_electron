"""
Assign Unique Numeric IDs to Master_Database
Adds a new 'id' column with sequential numeric IDs (1, 2, 3...)
Independent of Student_ID and Source_Sheet
"""

import pandas as pd
import os
from datetime import datetime

class UniqueIDAssigner:
    def __init__(self, file_path=None):
        if file_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            file_path = os.path.join(project_root, "data", "students.xlsx")
        
        self.file_path = file_path
        
    def assign_ids(self):
        """Assign unique numeric IDs to Master_Database sheet"""
        print("=" * 80)
        print("🔢 UNIQUE ID ASSIGNMENT")
        print("=" * 80)
        print(f"File: {self.file_path}")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        if not os.path.exists(self.file_path):
            print(f"\n❌ ERROR: File not found at {self.file_path}")
            return False
        
        try:
            # Read Excel file
            print("\n📖 Reading Excel file...")
            excel_file = pd.ExcelFile(self.file_path)
            
            if 'Master_Database' not in excel_file.sheet_names:
                print("❌ ERROR: Master_Database sheet not found!")
                return False
            
            # Load Master_Database
            df = pd.read_excel(self.file_path, sheet_name='Master_Database')
            print(f"✓ Loaded Master_Database: {len(df)} rows")
            
            # Check if 'id' column already exists
            if 'id' in df.columns:
                print("\n⚠️  WARNING: 'id' column already exists!")
                response = input("Do you want to regenerate IDs? (yes/no): ").strip().lower()
                if response not in ['yes', 'y']:
                    print("❌ Operation cancelled.")
                    return False
                print("✓ Will regenerate IDs...")
            
            # Remove empty rows (if any)
            original_count = len(df)
            df = df.dropna(how='all')
            if len(df) < original_count:
                print(f"✓ Removed {original_count - len(df)} empty rows")
            
            # Generate sequential IDs
            print(f"\n🔢 Generating unique numeric IDs...")
            df.insert(0, 'id', range(1, len(df) + 1))  # Insert as first column
            
            print(f"✓ Assigned IDs: 1 to {len(df)}")
            
            # Show sample
            print("\n📋 Sample ID assignments:")
            print("-" * 80)
            sample_df = df[['id', 'Student_ID', 'Full_Name', 'Source_Sheet']].head(10)
            print(sample_df.to_string(index=False))
            
            if len(df) > 10:
                print("\n   ... and {} more students\n".format(len(df) - 10))
            
            # Backup original file
            backup_path = self.file_path.replace('.xlsx', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx')
            print(f"\n💾 Creating backup: {os.path.basename(backup_path)}")
            
            import shutil
            shutil.copy2(self.file_path, backup_path)
            print("✓ Backup created")
            
            # Save updated Master_Database
            print(f"\n💾 Saving updated Master_Database...")
            
            # Read all sheets
            all_sheets = {}
            for sheet_name in excel_file.sheet_names:
                if sheet_name == 'Master_Database':
                    all_sheets[sheet_name] = df
                else:
                    all_sheets[sheet_name] = pd.read_excel(self.file_path, sheet_name=sheet_name)
            
            # Write all sheets back
            with pd.ExcelWriter(self.file_path, engine='openpyxl', mode='w') as writer:
                for sheet_name, sheet_df in all_sheets.items():
                    sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            print("✓ File saved successfully!")
            
            # Summary
            print("\n" + "=" * 80)
            print("✅ ID ASSIGNMENT COMPLETED!")
            print("=" * 80)
            print(f"Total students: {len(df)}")
            print(f"ID range: 1 to {len(df)}")
            print(f"Column position: First column")
            print(f"Backup created: {os.path.basename(backup_path)}")
            print("\n✓ Master_Database is now ready for the Electron app!")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    assigner = UniqueIDAssigner()
    
    if assigner.assign_ids():
        print("\n🎉 Success! You can now run your Electron app.")
    else:
        print("\n❌ Failed to assign IDs. Please check the errors above.")