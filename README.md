# OpenCut

Este repositório contém dois projetos em branches separadas:

| Branch | Descrição |
|--------|-----------|
| [`opencut`](https://github.com/henrkecrz/opencut-new/tree/opencut) | Editor de vídeo web com interface shadcn/ui, React, TypeScript e Vite |
| [`opencut-ai`](https://github.com/henrkecrz/opencut-new/tree/opencut-ai) | Backend de IA e serviços para o editor de vídeo (FastAPI, CLIP, Whisper, TTS) |

## OpenCut (`opencut`)

Editor de vídeo moderno rodando no navegador, construído com:
- React + TypeScript + Vite
- shadcn/ui
- Moon toolchain
- Cloudflare Workers (API)

## OpenCut-AI (`opencut-ai`)

Serviços de inteligência artificial para processamento de vídeo:
- FastAPI (backend Python)
- CLIP (busca visual)
- Whisper (transcrição)
- TTS, face detection, image generation
- Docker Compose para orquestração
