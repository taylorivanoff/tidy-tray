!macro customInstall
  ; Add to Windows startup (user can disable in Settings > Apps > Startup)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Tidy Tray" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Tidy Tray"
!macroend
