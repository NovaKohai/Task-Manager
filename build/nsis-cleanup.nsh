!macro customInit
  Push $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5

  ; Kill any running old Team Task Manager process
  nsExec::Exec '"taskkill" /f /im "Team Task Manager.exe"'
  Pop $0
  nsExec::Exec '"taskkill" /f /im "team-task-manager.exe"'
  Pop $0

  ; Backup old app data before uninstalling (preserve localStorage, IndexedDB, etc.)
  StrCpy $4 "$APPDATA\com.teamtaskmanager.app"
  StrCpy $5 "$APPDATA\com.novataskmanager.app"
  IfFileExists "$4\*.*" 0 skipBackup
    CreateDirectory "$5"
    CopyFiles /SILENT "$4\*.*" "$5"
  skipBackup:

  StrCpy $1 0
  loop32:
    EnumRegKey $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall" $1
    StrCmp $0 "" loop6432
    ReadRegStr $2 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\$0" "DisplayName"
    StrCmp $2 "Team Task Manager" 0 next32
    ReadRegStr $3 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\$0" "QuietUninstallString"
    StrCmp $3 "" try32nsis
    ExecWait $3
    Goto next32
  try32nsis:
    ReadRegStr $3 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\$0" "UninstallString"
    StrCmp $3 "" next32
    ExecWait '$3 /S'
  next32:
    IntOp $1 $1 + 1
    Goto loop32

  loop6432:
    StrCpy $1 0
  loop6432next:
    EnumRegKey $0 HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall" $1
    StrCmp $0 "" done
    ReadRegStr $2 HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$0" "DisplayName"
    StrCmp $2 "Team Task Manager" 0 next6432
    ReadRegStr $3 HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$0" "QuietUninstallString"
    StrCmp $3 "" try6432nsis
    ExecWait $3
    Goto next6432
  try6432nsis:
    ReadRegStr $3 HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$0" "UninstallString"
    StrCmp $3 "" next6432
    ExecWait '$3 /S'
  next6432:
    IntOp $1 $1 + 1
    Goto loop6432next

  done:
    ; Remove old install directory (uninstaller may leave it behind)
    IfFileExists "$PROGRAMFILES\Team Task Manager\*.*" 0 skipRmDir
      RMDir /r "$PROGRAMFILES\Team Task Manager"
    skipRmDir:

    Pop $5
    Pop $4
    Pop $3
    Pop $2
    Pop $1
    Pop $0
!macroend
