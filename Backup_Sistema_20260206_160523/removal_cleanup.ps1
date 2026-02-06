$files = @('.\manifests_generate.ps1','.\manifests_generate_relative.ps1','.\manifests_diff.ps1','.\manifests_diff_rel.ps1','.\safe-restore.ps1','.\README_SAFE_RESTORE.md')
foreach($f in $files){
    if(Test-Path $f){
        Remove-Item -Force -Recurse $f -ErrorAction SilentlyContinue
        Write-Host "Removed $f"
    } else {
        Write-Host "Not found $f"
    }
}
if(Test-Path .\manifests){
    Remove-Item -Force -Recurse .\manifests -ErrorAction SilentlyContinue
    Write-Host 'Removed manifests/'
} else { Write-Host 'manifests/ not found' }
if(Test-Path .\temp_restore){
    Remove-Item -Force -Recurse .\temp_restore -ErrorAction SilentlyContinue
    Write-Host 'Removed temp_restore/'
} else { Write-Host 'temp_restore/ not found' }
