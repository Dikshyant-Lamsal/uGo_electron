import pandas as pd
import sys
from pathlib import Path

def normalize_cohort(source_sheet):
    """
    Normalize cohort names to C1, C2, C3 format
    Examples:
      'ACC C1' -> 'C1'
      'C1' -> 'C1'
      'ACC C2' -> 'C2'
      'Database' -> 'C1' (default)
    """
    if not source_sheet or pd.isna(source_sheet):
        return 'C1'
    
    source_sheet = str(source_sheet).upper().strip()
    
    # Extract C number (C1, C2, C3, etc.)
    if 'C1' in source_sheet:
        return 'C1'
    elif 'C2' in source_sheet:
        return 'C2'
    elif 'C3' in source_sheet:
        return 'C3'
    elif 'C4' in source_sheet:
        return 'C4'
    elif 'C5' in source_sheet:
        return 'C5'
    else:
        # Default to C1 for unknown cohorts
        return 'C1'


def get_max_sequence(existing_ids):
    """
    Get the highest sequence number from existing IDs
    Example: UGO_C2_185 -> returns 185
    """
    max_seq = 0
    for student_id in existing_ids:
        if not student_id or pd.isna(student_id):
            continue
        try:
            # Extract number at the end (e.g., UGO_C1_045 -> 045)
            parts = str(student_id).split('_')
            if len(parts) >= 3 and parts[0] == 'UGO':
                seq_num = int(parts[-1])
                if seq_num > max_seq:
                    max_seq = seq_num
        except (ValueError, IndexError):
            continue
    return max_seq


def generate_student_id(sequence_number, cohort):
    """
    Generate Student ID in format: UGO_C1_001, UGO_C2_182, etc.
    Global sequential numbering across all cohorts.
    """
    # Pad to 3 digits
    sequence_str = str(sequence_number).zfill(3)
    return f"UGO_{cohort}_{sequence_str}"


def update_student_ids(excel_path, reset=False):
    """
    Update Master_Database sheet with unique Student_IDs
    Global sequential numbering: Student 1 gets 001, Student 180 gets 180,
    Student 181 (could be C2) gets 181, new C1 student gets 182, etc.
    
    Args:
        excel_path: Path to Excel file
        reset: If True, regenerate all IDs from 001. If False, continue from existing.
    """
    print(f"📖 Reading Excel file: {excel_path}")
    
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(excel_path)
        
        # Check if Master_Database exists
        if 'Master_Database' not in excel_file.sheet_names:
            print("❌ Master_Database sheet not found!")
            return False
        
        # Read Master_Database
        df = pd.read_excel(excel_path, sheet_name='Master_Database')
        
        print(f"📊 Found {len(df)} students in Master_Database")
        
        # ✅ Get current max sequence number
        if reset:
            print("🔄 RESET MODE: Regenerating all Student_IDs with global sequential numbering")
            print("   All students get sequential numbers regardless of cohort\n")
            current_sequence = 0
            # Clear existing Student_IDs
            df['Student_ID'] = None
        else:
            # Get existing IDs
            existing_ids = df['Student_ID'].dropna().tolist() if 'Student_ID' in df.columns else []
            current_sequence = get_max_sequence(existing_ids)
            print(f"📝 Found {len(existing_ids)} existing Student_IDs")
            print(f"🔢 Continuing from sequence number: {current_sequence + 1}\n")
        
        # Generate Student_IDs
        updates_count = 0
        cohort_counts = {}
        cohort_ranges = {}  # Track sequence ranges per cohort
        
        for idx, row in df.iterrows():
            # Get source sheet
            source_sheet = row.get('Source_Sheet', 'C1')
            normalized_cohort = normalize_cohort(source_sheet)
            
            # ✅ Check if already has valid ID (skip in non-reset mode)
            if not reset:
                current_id = row.get('Student_ID')
                if pd.notna(current_id) and str(current_id).startswith('UGO_'):
                    # Track cohort ranges
                    try:
                        seq = int(str(current_id).split('_')[-1])
                        if normalized_cohort not in cohort_ranges:
                            cohort_ranges[normalized_cohort] = {'min': seq, 'max': seq}
                        else:
                            cohort_ranges[normalized_cohort]['min'] = min(cohort_ranges[normalized_cohort]['min'], seq)
                            cohort_ranges[normalized_cohort]['max'] = max(cohort_ranges[normalized_cohort]['max'], seq)
                    except:
                        pass
                    
                    cohort_counts[normalized_cohort] = cohort_counts.get(normalized_cohort, 0) + 1
                    continue
            
            # Generate new ID with next sequence number
            current_sequence += 1
            new_id = generate_student_id(current_sequence, normalized_cohort)
            
            # Update dataframe
            df.at[idx, 'Student_ID'] = new_id
            df.at[idx, 'Cohort'] = normalized_cohort  # ✅ Also update Cohort column
            
            # Track cohort ranges
            if normalized_cohort not in cohort_ranges:
                cohort_ranges[normalized_cohort] = {'min': current_sequence, 'max': current_sequence}
            else:
                cohort_ranges[normalized_cohort]['min'] = min(cohort_ranges[normalized_cohort]['min'], current_sequence)
                cohort_ranges[normalized_cohort]['max'] = max(cohort_ranges[normalized_cohort]['max'], current_sequence)
            
            updates_count += 1
            cohort_counts[normalized_cohort] = cohort_counts.get(normalized_cohort, 0) + 1
            
            original_cohort = row.get('Source_Sheet', 'Unknown')
            if updates_count <= 10:  # Show first 10
                print(f"  ✅ {original_cohort:15} -> {normalized_cohort}: {new_id} ({row.get('Full_Name', 'Unknown')})")
        
        if updates_count > 10:
            print(f"  ... and {updates_count - 10} more")
        
        if updates_count == 0:
            print("ℹ️  All students already have Student_IDs")
        else:
            print(f"\n💾 Saving changes to Excel...")
            
            # Save back to Excel (preserve other sheets)
            with pd.ExcelWriter(excel_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
                df.to_excel(writer, sheet_name='Master_Database', index=False)
            
            print(f"✅ Successfully generated {updates_count} Student_IDs!")
        
        print(f"\n📝 Total students: {len(df)}")
        print(f"🔢 Sequence range: 001 - {current_sequence:03d}")
        
        print(f"\n📊 Students per cohort:")
        for cohort in sorted(cohort_counts.keys()):
            count = len(df[df['Cohort'] == cohort]) if 'Cohort' in df.columns else cohort_counts.get(cohort, 0)
            if cohort in cohort_ranges:
                range_info = f" (sequences {cohort_ranges[cohort]['min']:03d} - {cohort_ranges[cohort]['max']:03d})"
            else:
                range_info = ""
            print(f"  {cohort}: {count} students{range_info}")
        
        # Show sample IDs per cohort
        print("\n📋 Sample Student_IDs:")
        for cohort in sorted(cohort_counts.keys()):
            cohort_students = df[df['Cohort'] == cohort] if 'Cohort' in df.columns else df[df['Student_ID'].str.contains(f'UGO_{cohort}_', na=False)]
            if len(cohort_students) > 0:
                sample_ids = cohort_students['Student_ID'].head(3).tolist()
                print(f"  {cohort}: {', '.join(map(str, sample_ids))}")
        
        print("\n💡 Note: Student IDs use global sequential numbering.")
        print("   New students (any cohort) will continue from the next sequence number.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("=" * 80)
    print("🎓 U-Go Student ID Generator (Global Sequential Numbering)")
    print("=" * 80)
    print()
    
    # Get Excel file path
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        # Default path (adjust as needed)
        excel_path = input("Enter path to students.xlsx: ").strip('"')
    
    # Verify file exists
    if not Path(excel_path).exists():
        print(f"❌ File not found: {excel_path}")
        return
    
    # ✅ Ask for reset mode
    print(f"\n📁 File: {excel_path}")
    print("   Format: UGO_C1_001, UGO_C2_182, UGO_C1_183, etc.")
    print("   (Sequential numbering across all cohorts)\n")
    
    print("Choose mode:")
    print("  1. RESET - Regenerate ALL IDs starting from 001")
    print("  2. CONTINUE - Keep existing IDs and generate sequential IDs for new students")
    
    mode = input("\nEnter choice (1 or 2): ").strip()
    
    reset_mode = (mode == '1')
    
    if reset_mode:
        print("\n⚠️  RESET MODE: This will regenerate ALL Student_IDs from 001")
        confirm = input("Are you sure? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("❌ Cancelled")
            return
    else:
        confirm = input("\nContinue? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("❌ Cancelled")
            return
    
    # Update Student IDs
    success = update_student_ids(excel_path, reset=reset_mode)
    
    if success:
        print("\n" + "=" * 80)
        print("🎉 Done! Student_IDs have been generated and saved.")
        print("=" * 80)
    else:
        print("\n❌ Failed to update Student_IDs")


if __name__ == "__main__":
    main()