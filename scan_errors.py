
import os
import re

BASE_DIR = r"d:\work\studywithme"

def get_all_files(directory):
    files_list = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or 'docs-jocoding' in root:
            continue
        for file in files:
            files_list.append(os.path.join(root, file))
    return files_list

def check_link(base_path, link):
    if link.startswith('http') or link.startswith('//') or link.startswith('#'):
        return True
    
    # Clean anchor and query params
    link = link.split('#')[0].split('?')[0]
    
    if not link:
        return True

    # Absolute path (relative to root)
    if link.startswith('/'):
        target_path = os.path.join(BASE_DIR, link.lstrip('/'))
    else:
        # Relative path
        target_path = os.path.join(os.path.dirname(base_path), link)
        
    return os.path.exists(target_path)

def scan_file(file_path):
    errors = []
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # HTML Checks (src, href)
        if ext == '.html':
            # src="..."
            matches = re.finditer(r'src=["\'](.*?)["\']', content)
            for m in matches:
                link = m.group(1)
                if not check_link(file_path, link):
                    errors.append(f"Missing SRC: {link}")
            
            # href="..." (CSS, links)
            matches = re.finditer(r'href=["\'](.*?)["\']', content)
            for m in matches:
                link = m.group(1)
                 # Ignore special schemes
                if link.startswith('tel:') or link.startswith('mailto:') or link.startswith('javascript:'):
                    continue
                if not check_link(file_path, link):
                    errors.append(f"Missing HREF: {link}")
                    
        # JS Checks (imports)
        elif ext == '.js':
            # import ... from "..."
            matches = re.finditer(r'from\s+["\'](.*?)["\']', content)
            for m in matches:
                link = m.group(1)
                if not check_link(file_path, link):
                    errors.append(f"Missing IMPORT: {link}")
            
            # import "..."
            matches = re.finditer(r'import\s+["\'](.*?)["\']', content)
            for m in matches:
                link = m.group(1)
                if not check_link(file_path, link):
                    errors.append(f"Missing IMPORT: {link}")

    except Exception as e:
        errors.append(f"Error reading file: {str(e)}")
        
    return errors

def main():
    print("Starting Project Health Check...")
    all_files = get_all_files(BASE_DIR)
    
    total_errors = 0
    
    for file_path in all_files:
        if file_path.endswith(('.html', '.js', '.css')):
            errors = scan_file(file_path)
            if errors:
                rel_path = os.path.relpath(file_path, BASE_DIR)
                print(f"\n[FILE] {rel_path}")
                for err in errors:
                    print(f"  - {err}")
                    total_errors += 1
    
    print(f"\nScan Complete. Total potential errors found: {total_errors}")

if __name__ == "__main__":
    main()
