기술 스택
- Build Tool: Vite (r8.0.10)
- 3D Engine: Three.js (r184+) - ExtrudeGeometry 기반 정밀 모델링
- Compute: Cloudflare Pages Functions (Edge Computing)
- Database: Cloudflare KV Storage (Global Key-Value Store)
- API: Kakao Maps API v2 (셔틀 정류장 연동)
- Deployment: Cloudflare Pages (CI/CD, Clean URL Routing)

디렉토리 구조
- hongikWebProjrcts26/: 웹 소스 코드 루트
    - functions/api/diet.js: 서버리스 식단 크롤러 및 CDN 캐싱 API
    - src/: 메인 소스 코드 (main.js, style.css, shuttle.js, facility.js)
    - src/data/: 외부화된 데이터 (buildingConfigs.js, roomData.js)
    - public/: 정적 리소스
        - models/: 각 동(A~I)의 FBX/OBJ 모델 파일
        - Img/: 배경 맵, 로고 등 이미지
    - index.html: 메인 3D 맵 인터페이스 (Clean URL 적용)
    - facility.html: 시설 안내 및 고도화된 식단 뷰어
    - shuttle.html: 실시간 셔틀 현황 및 카카오 맵 연동 페이지
    - notice.html: 트리 구조 히스토리 및 피드백 페이지
- modelImg/: 모델링 참고용 원본 사진 및 블렌더 파일 (비배포)

핵심 로직 (src/main.js)

1. 정밀 건물 모델링 (Extrude Architecture)
- Vertices 기반 셰이프: 단순 Box 형태를 탈피, buildingConfigs.js에 정의된 꼭짓점 좌표를 연결하여 실제 건물의 바닥면(Footprint)을 1:1로 재현합니다.
- ExtrudeGeometry: 2D 셰이프를 건물의 높이만큼 돌출시켜 정교한 3D 매스로 변환합니다.
- Z축 반전 보정: Three.js와 지도 좌표계 간의 차이를 수학적으로 보정하여 정밀한 위치 매칭을 보장합니다.

2. 카메라 및 포커싱 시스템
- 물리적 중앙 계산: 건물의 중심 좌표(pos)가 아닌, 입력된 모든 꼭짓점의 평균값(avgX, avgZ)을 실시간 계산하여 카메라가 건물의 정중앙을 조준하도록 개선되었습니다.
- Lerp Animation: 0.02~0.03 보간값을 사용하여 부드러운 카메라 이동 및 층 전환 효과를 제공합니다.

3. 가시성 관리 (Visibility Sync)
- 4중 가시성 로직: 개발자 모드, 건물 선택, 층 선택, 전체보기 상태에 따라 모델, 라벨, 플레이스홀더의 가시성을 실시간 동기화합니다.
- 순백색 재질: 모든 건물에 순백색(0xffffff) 불투명 재질을 적용하고 PCFSoftShadowMap으로 입체감을 극대화했습니다.

서버리스 및 캐싱 시스템 (functions/api/diet.js)

4중 캐싱 체계 (Quad-Caching)
무료 요금제 자원을 보호하고 응답 속도를 극대화하기 위해 다층 방어 체계를 구축했습니다.
1. Browser LocalStorage: 당일 조회 기록이 있다면 서버 요청 없이 사용자 기기에서 즉시 로드.
2. Browser HTTP Cache: 네트워크 수준의 중복 요청 방어.
3. Cloudflare Edge Cache (CDN): 전 세계 에지 서버에 데이터를 복제하여 KV 저장소 접근 최소화.
4. Cloudflare KV Storage: 글로벌 영구 저장소에 데이터를 보관하여 학교 서버 부하를 원천 차단.

주요 연동 기능
- 셔틀버스 안내: shuttle.js를 통해 카카오 맵과 연동, 탑승 안내 클릭 시 해당 정류장으로 지도 자동 이동 및 마커 표시 기능을 제공합니다.
- 문의사항 (Notice): 사이드바 영역에 트리 구조의 개발 히스토리를 구현하고, 독립적인 스크롤바를 적용하여 데이터 가독성을 높였습니다.

