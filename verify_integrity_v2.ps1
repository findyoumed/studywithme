
Write-Host "STARTING VERIFICATION"
$jsonPath = "d:\work\studywithme\posts\all-posts.json"
$baseDir = "d:\work\studywithme"

try {
    $jsonContent = Get-Content $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json
    
    Write-Host "Total Posts found: $($jsonContent.Count)"
    
    $missingIds = @()
    $missingImages = @()
    $invalidExtensions = @()
    
    # Check for IDs 1 to 23
    1..23 | ForEach-Object {
        $id = $_
        $post = $jsonContent | Where-Object { $_.id -eq $id }
        
        if (-not $post) {
            $missingIds += $id
        }
        else {
            # Check Image
            $imagePath = $post.image
            if (-not $imagePath) {
                Write-Host "Post ID $id has no image property!"
            }
            else {
                # Check extension
                if ($imagePath -notmatch "\.jpg$") {
                    $invalidExtensions += "ID $id : $imagePath"
                }
                
                # Check file existence (remove leading slash for path joining if needed)
                $relPath = $imagePath -replace "^/", ""
                $relPath = $relPath -replace "/", "\"
                $fullPath = Join-Path $baseDir $relPath
                
                if (-not (Test-Path $fullPath)) {
                    $missingImages += "ID $id : $imagePath (checked: $fullPath)"
                }
            }
        }
    }
    
    if ($missingIds.Count -eq 0) {
        Write-Host "CHECK: All IDs (1-23) are present."
    }
    else {
        Write-Host "FAIL: Missing IDs: $($missingIds -join ', ')"
    }
    
    if ($invalidExtensions.Count -gt 0) {
        Write-Host "FAIL: Invalid Extensions (Not .jpg):"
        $invalidExtensions | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "CHECK: All images have .jpg extension."
    }

    if ($missingImages.Count -gt 0) {
        Write-Host "FAIL: Missing/Incorrect Image Files:"
        $missingImages | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "CHECK: All image files exist on disk."
    }

}
catch {
    Write-Host "CRITICAL ERROR: $_"
}
