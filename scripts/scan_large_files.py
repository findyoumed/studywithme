import os
import subprocess

def get_git_files():
    try:
        # Use git ls-files to get list of files respecting .gitignore
        result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, encoding='utf-8')
        if result.returncode != 0:
            print("Error: Not a git repository or git not found.")
            return []
        return result.stdout.splitlines()
    except Exception as e:
        print(f"Error running git command: {e}")
        return []

def is_code_file(filename):
    # Exclude documentation and assets
    exclude_exts = {
        '.md', '.txt', '.json', '.lock', '.log', '.map', 
        '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', 
        '.woff', '.woff2', '.ttf', '.eot', '.csv', '.xml'
    }
    _, ext = os.path.splitext(filename)
    return ext.lower() not in exclude_exts

def count_lines(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception as e:
        return 0

def main():
    threshold = 250
    print(f"🔍 Scanning for code files with more than {threshold} lines...")
    print(f"(Ignoring .gitignore files, documentation, and assets)\n")

    files = get_git_files()
    if not files:
        print("No files found via git. Falling back to simple walk (ignoring node_modules)...")
        # Fallback mechanism if git fails
        for root, dirs, filenames in os.walk('.'):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            if 'dist' in dirs: dirs.remove('dist')
            
            for name in filenames:
                files.append(os.path.join(root, name))

    large_files = []

    for file_path in files:
        if not os.path.isfile(file_path):
            continue
            
        if not is_code_file(file_path):
            continue

        lines = count_lines(file_path)
        if lines > threshold:
            large_files.append((file_path, lines))

    # Sort by line count (descending)
    large_files.sort(key=lambda x: x[1], reverse=True)

    if large_files:
        print(f"{'Lines':<8} | {'File Path'}")
        print("-" * 60)
        for path, count in large_files:
            print(f"{count:<8} | {path}")
        print("-" * 60)
        print(f"Found {len(large_files)} files exceeding {threshold} lines.")
    else:
        print(f"✅ Great job! No code files exceed {threshold} lines.")

if __name__ == "__main__":
    main()
