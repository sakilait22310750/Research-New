# PowerShell script to get your local IP address
# Run this script to find your IP address for mobile setup

Write-Host "`n=== Finding Your Local IP Address ===" -ForegroundColor Green
Write-Host ""

# Get all network adapters with IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*"
}

if ($adapters) {
    Write-Host "Your local IP addresses:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($adapter in $adapters) {
        $interface = Get-NetAdapter -InterfaceIndex $adapter.InterfaceIndex -ErrorAction SilentlyContinue
        $adapterName = if ($interface) { $interface.Name } else { "Unknown" }
        
        Write-Host "  $($adapter.IPAddress) - $adapterName" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Use the IP address from your Wi-Fi adapter (usually starts with 192.168.x.x)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Example backend URL: http://$($adapters[0].IPAddress):8000" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "No network adapters found!" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





