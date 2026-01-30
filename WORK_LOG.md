## [2026-01-29 19:32] 라이브 버튼 에러 수정

**LOG_ID: 20260129_1932**

**목표:**
라이브 방송 시작 버튼 클릭 시 발생하는 `TypeError: e.addEventListener is not a function` 에러 수정

**변경 파일:**

- `public/js/agora-rtc-client.js` (line 60-81, 22줄 수정)

**수행 작업:**

1. `publish()` 함수에 `videoTrack` null 체크 추가
2. `videoTrack`이 null일 때 자동으로 새 카메라 트랙 생성하도록 수정
3. LOG_ID 주석 추가 (추적 가능하도록)

**실행 방법:**

```bash
# 개발 서버 실행
node server.js
```

**기대 결과:**

1. 브라우저에서 `http://localhost:3000` 접속
2. 라이브 버튼 (`#btnGoLive`) 클릭
3. 에러 없이 버튼 활성화 (초록색)
4. 콘솔에 `[RTC] Published video track` 메시지 출력

**테스트 필요:**

- [ ] 카메라 켜진 상태에서 라이브 버튼 테스트
- [ ] 카메라 꺼진 상태에서 라이브 버튼 테스트
- [ ] 콘솔에 `TypeError` 에러 없는지 확인

**결과:** ⏳ 테스트 대기 중

---

## [2026-01-29 19:37] Go Live 버튼 아이콘 상태 표시

**LOG_ID: 20260129_1937**

**목표:**
Go Live 버튼의 아이콘이 상태에 따라 변경되도록 수정

**변경 파일:**

- `public/js/live-ui-manager.js` (line 76-98, 아이콘 토글 추가)

**수행 작업:**

1. `updateButtonsUI()` 함수에 아이콘 변경 로직 추가
2. 라이브 꺼짐 상태: `podcasts` 아이콘 표시
3. 라이브 켜짐 상태: `stop_circle` 아이콘 표시
4. 버튼 타이틀도 상태에 맞게 변경

**실행:**

```bash
node server.js
```

**기대 결과:**

- 라이브 시작 전: 방송 아이콘 (podcasts)
- 라이브 시작 후: 중지 아이콘 (stop_circle) + 빨간색
- 버튼 다시 클릭하면 라이브 종료 + 원래 아이콘으로 복귀

**결과:** ✅ 완료

**추가 수정 (19:39):**

- 브라우저 캐시 문제 해결을 위해 모든 버전을 v=36으로 업데이트
- `live-manager.js`, `agora-rtc-client.js`, `live-ui-manager.js` 등

---

## [2026-01-29 19:42] 🔧 근본 원인 수정: Agora Track 감지

**LOG_ID: 20260129_1942**

**근본 문제:**

- `createCameraTrack()`이 반환하는 Agora SDK track을 raw track으로 오인
- 이미 Agora track인데 다시 `createCustomVideoTrack()`으로 감싸려 시도 → 에러!

**해결:**

- Agora SDK track은 `trackMediaType` 속성으로 판단
- `trackMediaType !== undefined` → Agora track (그대로 사용)
- `kind === 'video'` → raw MediaStreamTrack (wrap 필요)

**변경:** `agora-rtc-client.js` publish() 함수
**버전:** v=38

**결과:** ✅ 수정 완료 - 테스트 필요

---

## [2026-01-29 22:30] 백그라운드 최적화 및 모듈화, 버그 수정

**LOG_ID: 20260129_2230**

**목표:**

1. 백그라운드 실행 시 시스템 자원(CPU/GPU/배터리/데이터) 최적화 및 공부 시간 누락 방지
2. 'Copy Room Link' 버튼 클릭 시 방송 자동 시작 기능 복구
3. `server.js` 및 `index.html` 파일 크기 축소 (모듈화)

**변경 파일:**

- `public/js/motion-manager.js`: 백그라운드 감지 로직, 3초 주기 완화, 렌더링 중단, 스로틀링 보정, 메모리 누수 방지
- `public/js/player-controller.js`: 백그라운드 시 유튜브 일시정지, 포그라운드 복귀 시 자동 재생
- `public/js/live-manager.js`: `getIsLive()` 게터 추가
- `public/js/live-ui-manager.js`: `isLive` 상태 동기화 방식 수정
- `public/index.html`: CSS 링크 제거 및 `main.css` 도입 (280줄 -> 200줄 이하)
- `public/css/main.css`: 신규 생성 (CSS @import 관리)
- `server.js`: Agora 토큰 로직 분리 (150줄 내외)
- `server/agora-controller.js`: 신규 생성

**수행 작업:**

1. **백그라운드 최적화 (Smart Study Mode):**
   - **AI 감시:** 3초 주기로 완화하여 인강 렉 방지 (`setInterval`)
   - **점수 보정:** 브라우저 스로틀링 고려하여 최대 10초 갭까지 인정
   - **자원 절약:** 캔버스 렌더링 및 UI 업데이트 중단, 유튜브 일시정지
   - **메모리 보호:** 루프마다 `pose = null` 처리로 GC 유도

2. **기능 복구:**
   - `LiveManager`에서 `isLive` 상태를 `getIsLive()` 함수로 전달하도록 변경하여 UI 매니저가 항상 최신 상태를 참조하도록 함.

3. **코드 다이어트:**
   - `index.html`의 CSS 링크들을 `main.css`로 통합 (@import)
   - `server.js`의 토큰 로직을 컨트롤러로 이관

**실행 검증:**

```bash
node --check public/js/motion-manager.js public/js/player-controller.js public/js/live-manager.js public/js/live-ui-manager.js server.js server/agora-controller.js
```

**결과:** ✅ Syntax OK

---

## [2026-01-30 13:05] 모바일 뷰어 레이아웃 수정

**LOG_ID: 20260130_1305**
목표: 모바일에서 화면 분할(가로) 문제 해결 및 버튼 가려짐 (Button cut-off) 해결
변경 파일: 
- `public/css/viewer-mode.css` (20줄 추가)
- `public/viewer.html` (10줄 추가)

**수행 작업:** 
1. **화면 분할 수정:** 모바일 Portrait(세로) 환경에서는 비디오가 2개 이상일 때 가로가 아닌 **세로로 쌓이도록(Stacked)** grid 옵션 추가.
2. **버튼 가려짐 수정:** 버튼을 감싸는 오버레이의 `bottom` 위치를 **80px**로 높여 모바일 하단 내비게이션 바에 가려지지 않도록 조정.
3. **Safe Area 적용:** 아이폰 등 노치 디자인 기기를 위해 `env(safe-area-inset-bottom)` 여백 추가.

**실행 방법:** 
`git push` 후 모바일에서 `viewer.html` 페이지(모드: viewer) 접속하여 확인.

**기대 결과:** 
1. 비디오가 가로로 찌그러지지 않고 세로로 꽉 차서 보임.
2. 하단 'Join & Share' 버튼이 모바일 브라우저 UI에 가려지지 않고 잘 보임.

**결과:** ✅ 대기 중 (사용자 확인 필요)
