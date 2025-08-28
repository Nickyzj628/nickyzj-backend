@echo off
REM 切换到项目目录（把下面路径改成你项目的实际路径）
cd /d E:\Projects\nickyzj_backend

REM 尝试恢复 PM2 进程
pm2 resurrect >nul 2>&1

REM 检查 PM2 是否有运行中的进程
for /f "skip=1 tokens=*" %%i in ('pm2 list ^| findstr /r /c:"online"') do (
    set hasProcess=1
)

if not defined hasProcess (
    echo [INFO] 没有已保存的 pm2 进程，尝试启动 ecosystem.config.cjs ...
    pm2 start ecosystem.config.cjs
    pm2 save
) else (
    echo [INFO] 已恢复 pm2 进程
)

exit /b
