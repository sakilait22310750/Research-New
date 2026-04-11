@echo off
echo ========================================
echo Finding Your Network IP Address
echo ========================================
echo.
echo Your IP addresses:
ipconfig | findstr IPv4
echo.
echo ========================================
echo IMPORTANT:
echo - Use 192.168.1.5 (your WiFi/Ethernet IP)
echo - DO NOT use 192.168.56.1 (VirtualBox/VMware)
echo ========================================
echo.
echo Your correct IP for the mobile app: 192.168.1.5
echo.
pause

