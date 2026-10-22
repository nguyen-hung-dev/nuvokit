; Keep Tauri's Windows registration and native uninstaller. Never remove the
; shared WebView2 runtime. Data deletion remains an explicit interactive choice.
LangString nuvoConfirmDelete 1066 "Xóa vĩnh viễn dữ liệu NuvoKit của tài khoản Windows hiện tại? Đây là cài đặt, lịch sử, gói tải thêm và bộ nhớ đệm trong AppData. Không thể hoàn tác.$\r$\n$\r$\nFile đã xuất ra thư mục riêng và Microsoft WebView2 được giữ lại.$\r$\n$\r$\nOK: gỡ app và xóa dữ liệu. Hủy: dừng gỡ, chưa thay đổi gì."
LangString nuvoConfirmDelete 1033 "Permanently delete this Windows user's NuvoKit settings, history, downloaded packages and cache in AppData? This cannot be undone.$\r$\n$\r$\nExported files outside AppData and the shared Microsoft WebView2 runtime are kept.$\r$\n$\r$\nOK: uninstall and delete data. Cancel: stop before making changes."

!macro NSIS_HOOK_POSTINSTALL
  ; Settings and Control Panel use UninstallString (the interactive wizard).
  ; Automation can use this separate command; silent uninstall preserves data.
  WriteRegStr SHCTX "${UNINSTKEY}" "QuietUninstallString" '$\"$INSTDIR\uninstall.exe$\" /S'
  WriteRegStr SHCTX "${UNINSTKEY}" "HelpLink" "https://github.com/nguyen-hung-dev/nuvokit/blob/main/docs/installation.md"
  ; The outer wizard installs silently. Save the selected language explicitly
  ; so an interactive/passive uninstall does not stop at a language picker.
  WriteRegStr HKCU "${MANUPRODUCTKEY}" "Installer Language" "$LANGUAGE"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; The confirmation page is skipped in these modes. Upgrades and automation
  ; must never acquire a destructive data choice from an uninitialized value.
  ${If} ${Silent}
  ${OrIf} $PassiveMode = 1
  ${OrIf} $UpdateMode = 1
    StrCpy $DeleteAppDataCheckboxState 0
  ${EndIf}
  ${If} $DeleteAppDataCheckboxState = 1
    ; This hook runs before Tauri removes any files, shortcuts or registry keys.
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION|MB_DEFBUTTON2 "$(nuvoConfirmDelete)" /SD IDCANCEL IDOK nuvo_delete_confirmed
    SetErrorLevel 1
    Abort
    nuvo_delete_confirmed:
  ${EndIf}
!macroend
