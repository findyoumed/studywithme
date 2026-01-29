# 🔒 방 참여자 수 제한 기능

## 📋 기능 설명

**최대 참여자**: 방당 **10명**까지만 입장 가능

### 작동 방식

1. **서버 측 제한** (안전함)
   - Token 발급 시 참여자 수 체크
   - 10명 초과 시 Token 발급 거부
   - 재접속하는 사용자는 허용

2. **자동 정리**
   - 사용자가 페이지를 닫으면 자동으로 카운트 감소
   - 방이 비면 자동 삭제

## 🎯 구현 내용

### Server (server.js)

```javascript
const MAX_PARTICIPANTS_PER_ROOM = 10;
const roomParticipants = new Map(); // { channelName: Set([uid1, uid2, ...]) }

// Token 발급 전 체크
if (currentCount >= MAX_PARTICIPANTS_PER_ROOM) {
  return res.status(403).json({
    error: "ROOM_FULL",
    message: "방이 가득 찼습니다!",
  });
}
```

### Client (live-manager.js)

```javascript
// 방 가득 참 에러 처리
if (errorData.error === "ROOM_FULL") {
  alert(`❌ ${errorData.message}\n\n다른 방을 이용해주세요.`);
  throw new Error("ROOM_FULL");
}

// 페이지 닫힐 때 알림
window.addEventListener("beforeunload", async () => {
  await fetch("/api/participant-left", {
    method: "POST",
    body: JSON.stringify({ channelName, uid: myUID }),
    keepalive: true,
  });
});
```

## 🧪 테스트 방법

### 1. 정상 입장 테스트

```bash
# 서버 재시작
node server.js

# 브라우저 1: 호스트
http://localhost:8000/?room=test123

# 브라우저 2-10: 시청자
http://localhost:8000/?room=test123&mode=viewer
```

### 2. 제한 테스트

```bash
# 브라우저 11번째에서 접속 시도
http://localhost:8000/?room=test123&mode=viewer

# 예상 결과:
❌ 방이 가득 찼습니다! (10/10명)
다른 방을 이용해주세요.
```

### 3. 재접속 테스트

```bash
# 기존 사용자가 새로고침 (F5)
# - 같은 UID로 재접속
# - 정상 입장됨 (제한 안 걸림)
```

### 4. 자동 정리 테스트

```bash
# 브라우저 1개 닫기
# → 서버 로그: ❌ [test123] Removed UID 12345. Total: 9

# 새로운 사용자 입장 시도
# → 정상 입장 가능 (9/10명)
```

## 📊 API 엔드포인트

### 1. Token 발급 (기존 + 제한 추가)

```
GET /api/get-agora-token?channelName=room123&uid=12345&role=publisher

Response (성공):
{
  "rtcToken": "...",
  "rtmToken": "..."
}

Response (방 가득 참):
{
  "error": "ROOM_FULL",
  "message": "방이 가득 찼습니다! (10/10명)",
  "currentParticipants": 10,
  "maxParticipants": 10
}
```

### 2. 퇴장 알림 (새로 추가)

```
POST /api/participant-left
Body: { "channelName": "room123", "uid": 12345 }

Response:
{ "success": true }
```

### 3. 방 상태 조회 (새로 추가)

```
GET /api/room-status?channelName=room123

Response:
{
  "channelName": "room123",
  "currentParticipants": 7,
  "maxParticipants": 10,
  "isFull": false,
  "canJoin": true
}
```

## ⚙️ 설정 변경

### 최대 참여자 수 변경

```javascript
// server.js 74번째 줄
const MAX_PARTICIPANTS_PER_ROOM = 10; // ← 여기 숫자 변경

// 예: 5명으로 제한
const MAX_PARTICIPANTS_PER_ROOM = 5;
```

## 🐛 제한사항 & 개선 방향

### 현재 제한

1. **메모리 기반** - 서버 재시작 시 카운트 초기화
2. **단일 서버** - 서버 여러 대 운영 시 동기화 안 됨

### 개선 방향 (필요 시)

1. **Redis 사용** - 서버 재시작해도 유지
2. **Database** - 영구 저장
3. **Agora Webhook** - 실제 채널 참여자 추적

```javascript
// Redis 예시 (향후 구현 시)
const redis = require("redis");
const redisClient = redis.createClient();

async function addParticipant(channelName, uid) {
  await redisClient.sAdd(`room:${channelName}`, uid.toString());
}

async function getRoomParticipantCount(channelName) {
  return await redisClient.sCard(`room:${channelName}`);
}
```

## ✅ 체크리스트

- [x] 서버 측 제한 구현
- [x] 클라이언트 에러 처리
- [x] 퇴장 알림 (beforeunload)
- [x] 재접속 허용
- [x] 자동 정리
- [x] API 엔드포인트 추가
- [ ] Redis 연동 (추후 필요 시)
- [ ] 관리자 페이지 (추후 필요 시)

## 📝 서버 로그 예시

```
🚀 StudyWithMe server running at http://studywithme.co:8000
Generating token for UID: 12345, Channel: test123, Role: publisher
✅ [test123] Added UID 12345. Total: 1
✅ [test123] Added UID 67890. Total: 2
...
✅ [test123] Added UID 11111. Total: 10
⛔ [test123] Room full! Rejected UID 22222 (10/10)
❌ [test123] Removed UID 12345. Total: 9
✅ [test123] Added UID 22222. Total: 10
```

---

**구현 완료 시간**: 약 30분  
**난이도**: 중급  
**안정성**: ⭐⭐⭐⭐ (메모리 기반), ⭐⭐⭐⭐⭐ (Redis 연동 시)
