# 라이브 버튼 에러 수정 완료

**LOG_ID: 20260129_1932**

## 수정 내용

### 문제

라이브 방송 버튼(`#btnGoLive`) 클릭 시 다음 에러 발생:

```
TypeError: e.addEventListener is not a function
```

### 원인

- `cameraManager.getVideoTrack()`가 `null` 반환
- `null` 값이 Agora SDK의 `createCustomVideoTrack()`에 전달됨
- SDK가 `addEventListener`를 호출하려 했지만 객체가 없어서 에러 발생

### 해결 방법

[agora-rtc-client.js](file:///d:/work/studywithme/public/js/agora-rtc-client.js#L60-L81) 파일의 `publish()` 함수 수정:

```diff
 async publish(videoTrack) {
     try {
-        // If track is a raw MediaStreamTrack, create a custom video track
-        if (!videoTrack.hasOwnProperty('_mediaStreamTrack')) {
+        // videoTrack이 null이거나 유효하지 않으면 새로 생성
+        if (!videoTrack) {
+            console.log('[RTC] No video track provided, creating new camera track...');
+            this.localTracks.videoTrack = await this.createCameraTrack();
+        } else if (!videoTrack.hasOwnProperty('_mediaStreamTrack')) {
             this.localTracks.videoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
         } else {
             this.localTracks.videoTrack = videoTrack;
         }
```

**핵심 변경사항:**

1. `videoTrack`이 `null`인지 먼저 체크
2. `null`이면 새 카메라 트랙 자동 생성
3. 명확한 로그 메시지 추가

## 테스트 방법

### 1️⃣ 서버 실행

```bash
node server.js
```

### 2️⃣ 브라우저에서 확인

```
http://localhost:3000
```

### 3️⃣ 라이브 버튼 클릭

- `#btnGoLive` 버튼 클릭
- **기대 결과:**
  - ✅ 버튼이 초록색으로 활성화
  - ✅ 콘솔에 `[RTC] Published video track` 출력
  - ✅ `TypeError` 에러 없음

### 4️⃣ 콘솔 확인

다음 메시지가 나타나면 정상:

```
[RTC] No video track provided, creating new camera track...
[RTC] Published video track
```

## 추적 정보

- **수정 파일:** `public/js/agora-rtc-client.js`
- **LOG_ID:** `20260129_1932`
- **작업 로그:** [WORK_LOG.md](file:///d:/work/studywithme/WORK_LOG.md)
