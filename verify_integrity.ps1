
$jsonPath = "d:\work\studywithme\posts\all-posts.json"
$baseDir = "d:\work\studywithme"

try {
    $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json
    
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
                
                # Check file existence (remove leading slash for path joining if needed, here we assume relative to root)
                $fullPath = Join-Path $baseDir $imagePath.TrimStart("/")
                if (-not (Test-Path $fullPath)) {
                    $missingImages += "ID $id : $imagePath"
                }
            }
        }
    }
    
    if ($missingIds.Count -eq 0) {
        Write-Host "All IDs (1-23) are present."
        
    }
    else {
        Write-Host "Missing IDs: $($missingIds -join ', ')"
    }
    
    if ($invalidExtensions.Count -gt 0) {
        Write-Host "Invalid Extensions (Not .jpg):"
        $invalidExtensions | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "All images have .jpg extension."
    }

    if ($missingImages.Count -gt 0) {
        Write-Host "Missing/Incorrect Image Files:"
        $missingImages | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "All image files exist on disk."
    }

}
catch {
    Write-Host "Error parsing JSON: $_"
}
