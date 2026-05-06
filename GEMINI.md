# 학교 3D 맵 프로젝트 (School 3D Map Project)

이 프로젝트는 학교 건물의 3D 모델을 웹 브라우저에서 시각화하여 사용자가 각 층과 강의실 위치를 쉽게 찾을 수 있도록 도와주는 서비스입니다.

## 기술 스택
- **Language:** JavaScript (Vanilla JS)
- **3D Library:** [Three.js](https://threejs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)

## 프로젝트 구조
```text
/
├── GEMINI.md          # 프로젝트 컨벤션 및 환경 설정 기록 파일
└── webSite/           # 프론트엔드 작업 폴더
    ├── public/
    │   └── models/    # 3D 모델링 파일(.glb, .gltf)이 위치할 폴더
    ├── src/
    │   ├── main.js    # Three.js 씬 초기화 및 로더 로직
    │   └── style.css  # 기본 UI 및 캔버스 스타일
    ├── index.html     # 진입점 HTML
    ├── package.json   # 의존성 및 스크립트 설정
    └── vite.config.js # Vite 설정 (필요 시)
```

## 개발 지침
1. **모델 관리:** 모든 3D 모델 파일은 `webSite/public/models/`에 저장하고, 코드 내에서는 절대 경로 `/models/...`로 참조합니다.
2. **코드 스타일:** Three.js 객체(Scene, Camera, Renderer)는 모듈화하여 관리하는 것을 지향합니다.
3. **리소스 최적화:** 3D 모델은 압축된 `.glb` 형식을 권장합니다.
