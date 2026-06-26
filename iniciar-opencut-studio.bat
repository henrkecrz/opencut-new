@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=%~dp0"
set "WEB_URL=http://localhost:5173"
set "AI_URL=http://localhost:8420"
set "OLLAMA_URL=http://localhost:11434/api/tags"
set "DEFAULT_MODEL=llama3.2:1b"
set "MODE=%~1"
set "PNPM_CMD="

if "%MODE%"=="" set "MODE=core"

title OpenCut Studio - Preparar e iniciar

echo.
echo ============================================================
echo  OpenCut Studio - verificacao, instalacao e inicializacao
echo ============================================================
echo.

cd /d "%ROOT%"

if not exist "pnpm-workspace.yaml" (
  echo [ERRO] Este arquivo precisa ser executado na raiz do repositorio.
  echo        Arquivo esperado: pnpm-workspace.yaml
  pause
  exit /b 1
)

call :check_command node "Node.js"
if errorlevel 1 goto :fail

for /f "tokens=*" %%v in ('node --version 2^>nul') do set "NODE_VERSION=%%v"
echo [OK] Node.js encontrado: %NODE_VERSION%

call :ensure_pnpm
if errorlevel 1 goto :fail

for /f "tokens=*" %%v in ('%PNPM_CMD% --version 2^>nul') do set "PNPM_VERSION=%%v"
echo [OK] pnpm pronto: %PNPM_VERSION%
echo [INFO] Comando pnpm usado: %PNPM_CMD%

call :check_command docker "Docker"
if errorlevel 1 goto :fail

docker compose version >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Docker Compose nao encontrado.
  echo        Atualize o Docker Desktop para uma versao com 'docker compose'.
  pause
  exit /b 1
)

echo [INFO] Verificando se o Docker Engine esta ativo...
docker info >nul 2>nul
if errorlevel 1 (
  echo [INFO] Docker Engine nao respondeu. Tentando abrir Docker Desktop...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  ) else if exist "%LocalAppData%\Docker\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo [AVISO] Docker Desktop nao foi encontrado automaticamente.
    echo         Abra o Docker Desktop manualmente e rode este arquivo novamente.
    pause
    exit /b 1
  )

  call :wait_docker
  if errorlevel 1 (
    echo [ERRO] Docker nao iniciou dentro do tempo esperado.
    pause
    exit /b 1
  )
)
echo [OK] Docker Engine ativo.

echo.
echo [INFO] Preparando arquivos de ambiente...
call :prepare_env_files
if errorlevel 1 goto :fail

echo.
echo [INFO] Aprovando scripts de build (esbuild, sharp, workerd)...
call %PNPM_CMD% approve-builds esbuild sharp workerd lightningcss 2>nul

echo [INFO] Instalando dependencias do workspace...
call %PNPM_CMD% install
if errorlevel 1 (
  echo [AVISO] Instalacao na raiz falhou. Tentando instalar pelo app web...
  call %PNPM_CMD% --dir "OpenCut\apps\web" install
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)
echo [OK] Dependencias instaladas.

echo.
if /I "%MODE%"=="full" (
  set "COMPOSE_SERVICES=ollama ai-backend whisper-service tts-service image-service speaker-service face-service clip-service turboquant-service"
  echo [INFO] Modo FULL selecionado. Isso pode consumir bastante memoria e baixar modelos grandes.
) else (
  set "COMPOSE_SERVICES=ollama ai-backend whisper-service"
  echo [INFO] Modo CORE selecionado. Subindo Ollama, AI Backend e Whisper.
)

echo [INFO] Iniciando servicos Docker do OpenCut-AI...
pushd "OpenCut-AI"
docker compose up -d --build %COMPOSE_SERVICES%
if errorlevel 1 (
  popd
  echo [ERRO] Falha ao iniciar servicos Docker.
  pause
  exit /b 1
)

echo [INFO] Aguardando Ollama responder...
call :wait_url "%OLLAMA_URL%" "Ollama" 60
if errorlevel 1 (
  echo [AVISO] Ollama ainda nao respondeu. O backend pode demorar mais na primeira execucao.
) else (
  echo [OK] Ollama ativo.
  echo [INFO] Verificando modelo LLM padrao: %DEFAULT_MODEL%
  docker compose exec -T ollama ollama list | findstr /C:"%DEFAULT_MODEL%" >nul 2>nul
  if errorlevel 1 (
    echo [INFO] Baixando modelo %DEFAULT_MODEL% para comandos de IA...
    docker compose exec -T ollama ollama pull %DEFAULT_MODEL%
    if errorlevel 1 echo [AVISO] Nao foi possivel baixar o modelo agora. Tente novamente depois.
  ) else (
    echo [OK] Modelo %DEFAULT_MODEL% ja esta disponivel.
  )
)

echo [INFO] Aguardando backend de IA em %AI_URL%/health ...
call :wait_url "%AI_URL%/health" "AI Backend" 90
if errorlevel 1 (
  echo [AVISO] Backend de IA ainda nao respondeu.
  echo         Veja logs com: docker compose logs -f ai-backend
) else (
  echo [OK] Backend de IA ativo.
)
popd

echo.
echo [INFO] Iniciando OpenCut Studio Web em %WEB_URL% ...
start "OpenCut Studio Web" cmd /k "cd /d ""%ROOT%OpenCut\apps\web"" && set ""VITE_AI_BACKEND_URL=%AI_URL%"" && call %PNPM_CMD% dev --host 127.0.0.1"

echo [INFO] Aguardando app web responder...
call :wait_url "%WEB_URL%" "OpenCut Web" 60
if errorlevel 1 (
  echo [AVISO] O navegador sera aberto, mas o Vite pode ainda estar compilando.
) else (
  echo [OK] OpenCut Web ativo.
)

echo [INFO] Abrindo navegador...
start "" "%WEB_URL%"

echo.
echo ============================================================
echo  Sistema iniciado
echo ============================================================
echo  Web:        %WEB_URL%
echo  AI Backend: %AI_URL%/health
echo.
echo  Para modo completo, rode:
echo  iniciar-opencut-studio.bat full
echo.
echo  Para parar os containers:
echo  cd OpenCut-AI ^&^& docker compose down
echo ============================================================
echo.
pause
exit /b 0

:check_command
where %~1 >nul 2>nul
if errorlevel 1 (
  echo [ERRO] %~2 nao encontrado no PATH.
  exit /b 1
)
exit /b 0

:ensure_pnpm
where pnpm >nul 2>nul
if not errorlevel 1 (
  set "PNPM_CMD=pnpm"
  exit /b 0
)

echo [INFO] pnpm nao encontrado no PATH.
echo [INFO] Evitando Corepack em C:\Program Files para nao exigir Administrador.

where npm >nul 2>nul
if not errorlevel 1 (
  set "NPM_USER_PREFIX=%APPDATA%\npm"
  if not exist "!NPM_USER_PREFIX!" mkdir "!NPM_USER_PREFIX!" >nul 2>nul
  echo [INFO] Tentando instalar pnpm no perfil do usuario: !NPM_USER_PREFIX!
  call npm config set prefix "!NPM_USER_PREFIX!" --location=user >nul 2>nul
  call npm install -g pnpm --prefix "!NPM_USER_PREFIX!"
  if not errorlevel 1 (
    set "PATH=!NPM_USER_PREFIX!;!PATH!"
    where pnpm >nul 2>nul
    if not errorlevel 1 (
      set "PNPM_CMD=pnpm"
      exit /b 0
    )
  )
)

echo [AVISO] Nao foi possivel instalar pnpm globalmente no perfil do usuario.
echo [INFO] Usando fallback sem instalacao global: npx --yes pnpm@latest
where npx >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npx nao encontrado. Reinstale o Node.js com npm incluido.
  exit /b 1
)

set "PNPM_CMD=npx --yes pnpm@latest"
call %PNPM_CMD% --version >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Nao foi possivel executar pnpm via npx.
  exit /b 1
)
exit /b 0

:wait_docker
for /l %%i in (1,1,60) do (
  docker info >nul 2>nul
  if not errorlevel 1 exit /b 0
  echo [INFO] Aguardando Docker iniciar... %%i/60
  timeout /t 3 >nul
)
exit /b 1

:wait_url
set "CHECK_URL=%~1"
set "CHECK_NAME=%~2"
set "CHECK_MAX=%~3"
for /l %%i in (1,1,%CHECK_MAX%) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%CHECK_URL%' -TimeoutSec 3; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } exit 1 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 exit /b 0
  echo [INFO] Aguardando %CHECK_NAME%... %%i/%CHECK_MAX%
  timeout /t 2 >nul
)
exit /b 1

:prepare_env_files
if not exist "OpenCut\apps\web" (
  echo [ERRO] Pasta OpenCut\apps\web nao encontrada.
  exit /b 1
)

if not exist "OpenCut-AI\docker-compose.yml" (
  echo [ERRO] Arquivo OpenCut-AI\docker-compose.yml nao encontrado.
  exit /b 1
)

if not exist "OpenCut\apps\web\.env.local" (
  echo VITE_AI_BACKEND_URL=%AI_URL%> "OpenCut\apps\web\.env.local"
) else (
  findstr /C:"VITE_AI_BACKEND_URL" "OpenCut\apps\web\.env.local" >nul 2>nul
  if errorlevel 1 echo VITE_AI_BACKEND_URL=%AI_URL%>> "OpenCut\apps\web\.env.local"
)

if not exist "OpenCut-AI\.env" (
  > "OpenCut-AI\.env" echo OLLAMA_DEFAULT_MODEL=%DEFAULT_MODEL%
  >> "OpenCut-AI\.env" echo WHISPER_MODEL_SIZE=base
  >> "OpenCut-AI\.env" echo AI_MEMORY_BUDGET=auto
  >> "OpenCut-AI\.env" echo AI_MODEL_TIER=auto
  >> "OpenCut-AI\.env" echo KV_CACHE_BITS=4
  >> "OpenCut-AI\.env" echo AI_LLM_BACKEND=auto
) else (
  findstr /C:"OLLAMA_DEFAULT_MODEL" "OpenCut-AI\.env" >nul 2>nul
  if errorlevel 1 echo OLLAMA_DEFAULT_MODEL=%DEFAULT_MODEL%>> "OpenCut-AI\.env"
)

exit /b 0

:fail
echo.
echo [ERRO] Processo interrompido.
pause
exit /b 1
