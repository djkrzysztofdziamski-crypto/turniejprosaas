# Turniejomat - konfiguracja SMTP Hosti24 (admin@turniejomat.pl)
# Uruchom: .\scripts\setup-email-hosti24.ps1

$ErrorActionPreference = "Stop"
Write-Host ""
Write-Host "=== Turniejomat - SMTP Hosti24 ===" -ForegroundColor Cyan
Write-Host ""

$email = Read-Host 'Adres email [Enter = admin@turniejomat.pl]'
if ([string]::IsNullOrWhiteSpace($email)) { $email = 'admin@turniejomat.pl' }

$securePass = Read-Host 'Haslo do skrzynki Hosti24' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$pass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($pass)) {
    Write-Host 'Haslo nie moze byc puste.' -ForegroundColor Red
    exit 1
}

$env:SMTP_HOST = 'mx.hosti24.pl'
$env:SMTP_PORT = '465'
$env:SMTP_USER = $email
$env:SMTP_PASS = $pass
$env:SMTP_SECURE = 'true'
$env:SMTP_FROM = ('Turniejomat <{0}>' -f $email)
$env:SMTP_REPLY_TO = $email

Write-Host ''
Write-Host 'Zapisuje config Firebase (email.*)...' -ForegroundColor Yellow
node scripts/setup-email-config.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Deploy funkcji (ok. 2 min)...' -ForegroundColor Yellow
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'GOTOWE!' -ForegroundColor Green
Write-Host '1. admin.turniejomat.pl - zaloguj sie'
Write-Host '2. Kliknij TEST SMTP'
Write-Host '3. Przy zamowieniu WYSLIJ lub platnosc test na landingu'
Write-Host ''
