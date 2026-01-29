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
