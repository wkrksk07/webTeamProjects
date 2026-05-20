export default {
  // 1. HTTP 요청 핸들러: 캐시 확인 후 KV 데이터 반환
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // 수동 갱신 경로 처리
    if (url.pathname === '/update') {
      await updateMenu(env);
      // 갱신 시 캐시 삭제 (선택 사항)
      return new Response(JSON.stringify({ message: "Update triggered" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 1. CDN 캐시 먼저 확인 (KV 읽기 횟수 절약)
    let response = await cache.match(cacheKey);
    if (response) {
      console.log('Serving from CDN Cache');
      return response;
    }

    // 2. 캐시 없으면 KV에서 읽기
    const menuData = await env.MENU_KV.get('hongik-menu');
    if (!menuData) {
      return new Response(JSON.stringify({ error: "No data" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. 응답 객체 생성 및 캐시 설정 (1시간 동안 CDN 캐싱)
    response = new Response(menuData, {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600" // 1시간 캐시
      }
    });

    // 캐시에 저장 (백그라운드에서 수행)
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },

  // 2. Cron Trigger 핸들러: 매일 정해진 시간에 실행되어 데이터를 갱신
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateMenu(env));
  }
};

/**
 * 홍익대학교 식단 페이지를 크롤링하여 KV에 저장하는 함수
 */
async function updateMenu(env) {
  const targetUrl = 'https://www.hongik.ac.kr/kr/life/dining-room-view.do?articleNo=5415&restNo=0';
  
  // 브라우저처럼 보이기 위한 User-Agent 설정
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch Hongik menu page');
    return;
  }

  let tableData = [];
  let currentRow = [];
  let currentText = "";

  // HTMLRewriter를 이용한 저비용 고성능 파싱
  // 10ms CPU 타임 제한 내에서 동작하도록 설계됨
  const rewriter = new HTMLRewriter()
    .on('tr', {
      element() {
        currentRow = [];
      },
      onEndTag() {
        // 비어있지 않은 행만 수집
        const filteredRow = currentRow.map(text => text.replace(/\s+/g, ' ').trim()).filter(text => text !== "");
        if (filteredRow.length > 0) {
          tableData.push(filteredRow);
        }
      }
    })
    .on('th, td', {
      element() {
        currentText = "";
      },
      text(text) {
        currentText += text.text;
      },
      onEndTag() {
        currentRow.push(currentText);
      }
    });

  // 파싱 실행
  await rewriter.transform(response).arrayBuffer();

  // 데이터 정제 (홍익대 식단표 특성에 맞춤)
  // 보통 첫 번째 행은 요일/날짜, 이후 행은 식단 카테고리별 메뉴
  const processedData = {
    title: "홍익대학교 세종캠퍼스 식단 정보",
    url: targetUrl,
    updatedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    schedule: tableData
  };

  // KV에 JSON 문자열로 저장
  await env.MENU_KV.put('hongik-menu', JSON.stringify(processedData));
  console.log('Menu updated successfully at ' + processedData.updatedAt);
}
