#!/usr/bin/env python3
"""
Script to index music score hierarchy and create a neural network-readable structure description.
Focuses on main differences within categories, avoiding redundant path repetition.
"""

import os
import json
from pathlib import Path
from collections import defaultdict, Counter
import re

def clean_filename(filename):
    """Clean filename from extensions and common suffixes"""
    # Remove file extensions
    name = re.sub(r'\.(pdf|PDF)$', '', filename)
    # Remove common patterns like numbers, brackets
    name = re.sub(r'\s*\(\d+\)\s*$', '', name)
    name = re.sub(r'\s*\[\d+\]\s*$', '', name)
    return name.strip()

def extract_composer_work(path_parts):
    """Extract composer and work information from path parts
    
    Expected patterns:
    - Category/Composer/Work
    - Category/Subcategory/Composer/Work  
    - Category/Subcategory/Subsubcategory/Composer/Work (rare)
    """
    if len(path_parts) < 3:  # Need at least Category/Composer/Work
        return None, None
    
    composer = None
    work = None
    
    # Pattern 1: Category/Composer/Work (most common)
    if len(path_parts) == 3:
        composer = path_parts[1]  # Second element is composer
        work = path_parts[2]      # Third element is work
    
    # Pattern 2: Category/Subcategory/Composer/Work
    elif len(path_parts) == 4:
        composer = path_parts[2]  # Third element is composer
        work = path_parts[3]      # Fourth element is work
    
    # Pattern 3: Category/Subcategory/Subsubcategory/Composer/Work (rare)
    elif len(path_parts) >= 5:
        composer = path_parts[-2]  # Second to last is composer
        work = path_parts[-1]      # Last is work
    
    return composer, work

def analyze_hierarchy(root_path, output_file):
    """Analyze the music score hierarchy and create structured output"""
    
    if not os.path.exists(root_path):
        print(f"Error: Path {root_path} does not exist")
        return
    
    # Structure to hold organized data
    hierarchy_data = {
        "categories": {},
        "composers": defaultdict(set),
        "patterns": {
            "common_works": Counter(),
            "subcategories": defaultdict(set),
            "file_patterns": Counter(),
            "hierarchy_depths": Counter(),
            "structure_types": Counter()
        },
        "statistics": {}
    }
    
    pdf_count = 0
    total_dirs = 0
    
    # Walk through the directory structure
    for root, dirs, files in os.walk(root_path):
        total_dirs += 1
        rel_path = os.path.relpath(root, root_path)
        path_parts = rel_path.split(os.sep) if rel_path != '.' else []
        
        # Skip root directory
        if not path_parts:
            continue
            
        category = path_parts[0]
        
        # Initialize category if not exists
        if category not in hierarchy_data["categories"]:
            hierarchy_data["categories"][category] = {
                "composers": set(),
                "subcategories": set(),
                "works": set(),
                "structure_examples": []
            }
        
        # Count PDF files
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        pdf_count += len(pdf_files)
        
        if pdf_files:
            # Extract composer and work information
            composer, work = extract_composer_work(path_parts)
            
            if composer:
                hierarchy_data["categories"][category]["composers"].add(composer)
                hierarchy_data["composers"][composer].add(category)
            
            if work:
                work_clean = clean_filename(work)
                hierarchy_data["categories"][category]["works"].add(work_clean)
                hierarchy_data["patterns"]["common_works"][work_clean] += 1
            
            # Track hierarchy patterns
            hierarchy_data["patterns"]["hierarchy_depths"][len(path_parts)] += 1
            
            if len(path_parts) == 3:
                hierarchy_data["patterns"]["structure_types"]["Category/Composer/Work"] += 1
            elif len(path_parts) == 4:
                hierarchy_data["patterns"]["structure_types"]["Category/Subcategory/Composer/Work"] += 1
            elif len(path_parts) >= 5:
                hierarchy_data["patterns"]["structure_types"]["Category/Subcategory/Subsubcategory/Composer/Work"] += 1
            
            # Add subcategories based on hierarchy depth
            if len(path_parts) >= 2:
                # For Category/Subcategory/Composer/Work pattern
                if len(path_parts) == 4:
                    subcategory = path_parts[1]  # First subcategory level
                    hierarchy_data["categories"][category]["subcategories"].add(subcategory)
                    hierarchy_data["patterns"]["subcategories"][category].add(subcategory)
                
                # For Category/Subcategory/Subsubcategory/Composer/Work pattern
                elif len(path_parts) >= 5:
                    subcategory = path_parts[1]  # First subcategory level
                    subsubcategory = path_parts[2]  # Second subcategory level
                    hierarchy_data["categories"][category]["subcategories"].add(f"{subcategory}/{subsubcategory}")
                    hierarchy_data["patterns"]["subcategories"][category].add(f"{subcategory}/{subsubcategory}")
            
            # Record structure example (avoid too many similar examples)
            if len(hierarchy_data["categories"][category]["structure_examples"]) < 5:
                example = {
                    "path": "/".join(path_parts),
                    "depth": len(path_parts),
                    "pdf_count": len(pdf_files),
                    "sample_files": [clean_filename(f) for f in pdf_files[:3]]
                }
                hierarchy_data["categories"][category]["structure_examples"].append(example)
            
            # Track file naming patterns
            for pdf_file in pdf_files:
                clean_name = clean_filename(pdf_file)
                if clean_name:
                    hierarchy_data["patterns"]["file_patterns"][clean_name] += 1
    
    # Convert sets to lists for JSON serialization
    for category in hierarchy_data["categories"]:
        for key in ["composers", "subcategories", "works"]:
            hierarchy_data["categories"][category][key] = sorted(list(hierarchy_data["categories"][category][key]))
    
    # Convert defaultdict to regular dict
    hierarchy_data["composers"] = {k: sorted(list(v)) for k, v in hierarchy_data["composers"].items()}
    hierarchy_data["patterns"]["subcategories"] = {k: sorted(list(v)) for k, v in hierarchy_data["patterns"]["subcategories"].items()}
    
    # Add statistics
    hierarchy_data["statistics"] = {
        "total_categories": len(hierarchy_data["categories"]),
        "total_composers": len(hierarchy_data["composers"]),
        "total_pdf_files": pdf_count,
        "total_directories": total_dirs,
        "most_common_works": hierarchy_data["patterns"]["common_works"].most_common(10),
        "categories_with_subcategories": len([c for c in hierarchy_data["categories"] if hierarchy_data["categories"][c]["subcategories"]]),
        "hierarchy_depth_distribution": dict(hierarchy_data["patterns"]["hierarchy_depths"]),
        "structure_type_distribution": dict(hierarchy_data["patterns"]["structure_types"])
    }
    
    # Write human-readable analysis
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("MUSIC SCORE LIBRARY HIERARCHY ANALYSIS\n")
        f.write("=" * 50 + "\n\n")
        
        f.write("OVERVIEW:\n")
        f.write(f"Total Categories: {hierarchy_data['statistics']['total_categories']}\n")
        f.write(f"Total Composers: {hierarchy_data['statistics']['total_composers']}\n")
        f.write(f"Total PDF Files: {hierarchy_data['statistics']['total_pdf_files']}\n")
        f.write(f"Total Directories: {hierarchy_data['statistics']['total_directories']}\n\n")
        
        f.write("CATEGORY STRUCTURE:\n")
        f.write("-" * 30 + "\n")
        
        for category, data in sorted(hierarchy_data["categories"].items()):
            f.write(f"\n{category.upper()}:\n")
            f.write(f"  Composers ({len(data['composers'])}): {', '.join(data['composers'][:10])}")
            if len(data['composers']) > 10:
                f.write(f" ... and {len(data['composers']) - 10} more")
            f.write("\n")
            
            if data['subcategories']:
                f.write(f"  Subcategories: {', '.join(data['subcategories'])}\n")
            
            f.write(f"  Notable Works: {', '.join(data['works'][:5])}")
            if len(data['works']) > 5:
                f.write(f" ... and {len(data['works']) - 5} more")
            f.write("\n")
            
            f.write("  Structure Examples:\n")
            for example in data['structure_examples']:
                f.write(f"    {example['path']} ({example['pdf_count']} PDFs)\n")
        
        f.write(f"\nHIERARCHY STRUCTURE PATTERNS:\n")
        f.write("-" * 35 + "\n")
        for structure_type, count in hierarchy_data['statistics']['structure_type_distribution'].items():
            f.write(f"  {structure_type}: {count} instances\n")
        
        f.write(f"\nDEPTH DISTRIBUTION:\n")
        f.write("-" * 25 + "\n")
        for depth, count in sorted(hierarchy_data['statistics']['hierarchy_depth_distribution'].items()):
            f.write(f"  {depth} levels deep: {count} directories\n")
        
        f.write(f"\nMOST COMMON WORKS ACROSS CATEGORIES:\n")
        f.write("-" * 40 + "\n")
        for work, count in hierarchy_data['statistics']['most_common_works']:
            f.write(f"  {work}: appears in {count} locations\n")
        
        f.write(f"\nCOMPOSER DISTRIBUTION:\n")
        f.write("-" * 25 + "\n")
        for composer, categories in sorted(hierarchy_data["composers"].items()):
            if len(categories) > 1:  # Composers appearing in multiple categories
                f.write(f"  {composer}: {', '.join(categories)}\n")
    
    # Write JSON data for machine processing
    json_file = output_file.replace('.txt', '_data.json')
    with open(json_file, 'w', encoding='utf-8') as f:
        # Convert Counter objects to dict for JSON serialization
        json_data = hierarchy_data.copy()
        json_data["patterns"]["common_works"] = dict(json_data["patterns"]["common_works"])
        json_data["patterns"]["file_patterns"] = dict(json_data["patterns"]["file_patterns"])
        json_data["patterns"]["hierarchy_depths"] = dict(json_data["patterns"]["hierarchy_depths"])
        json_data["patterns"]["structure_types"] = dict(json_data["patterns"]["structure_types"])
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"Analysis complete!")
    print(f"Human-readable report: {output_file}")
    print(f"Machine-readable data: {json_file}")
    print(f"Found {pdf_count} PDF files across {len(hierarchy_data['categories'])} categories")

def main():
    import sys
    
    # Get the music files directory path
    if len(sys.argv) > 1:
        music_root = sys.argv[1]
    else:
        music_root = input("Enter the path to your music files directory (or press Enter for current directory): ").strip()
        if not music_root:
            music_root = "."  # Default to current directory
    
    output_file = "hierarchy_analysis.txt"
    
    print(f"Indexing hierarchy at: {os.path.abspath(music_root)}")
    analyze_hierarchy(music_root, output_file)

if __name__ == "__main__":
    main()