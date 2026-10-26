Unicode true

!include "MUI2.nsh"

Name "Hardware Patriots"
OutFile "..\release\Hardware-Patriots-Setup-0.1.0-win-x64.exe"
InstallDir "$LOCALAPPDATA\Hardware Patriots"
RequestExecutionLevel user
ShowInstDetails show

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\release\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Hardware Patriots"
  CreateShortcut "$SMPROGRAMS\Hardware Patriots\Hardware Patriots.lnk" "$INSTDIR\Hardware Patriots.exe"
  CreateShortcut "$SMPROGRAMS\Hardware Patriots\Uninstall Hardware Patriots.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Hardware Patriots.lnk" "$INSTDIR\Hardware Patriots.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\Hardware Patriots.lnk"
  Delete "$SMPROGRAMS\Hardware Patriots\Hardware Patriots.lnk"
  Delete "$SMPROGRAMS\Hardware Patriots\Uninstall Hardware Patriots.lnk"
  RMDir "$SMPROGRAMS\Hardware Patriots"
  RMDir /r "$INSTDIR"
SectionEnd
