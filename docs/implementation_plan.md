# 라이브 방송 버튼 에러 수정

## 문제 설명

**현재 상황:**

- 라이브 방송 시작 버튼 (`#btnGoLive`) 클릭 시 에러 발생
- 에러 메시지: `TypeError: e.addEventListener is not a function`

**원인:**

1. `window.cameraManager.getVideoTrack()`가 `null`을 반환
2. `null` 값이 Agora SDK의 `createCustomVideoTrack()`에 전달됨
3. Agora SDK가 `addEventListener`를 호출하려 하지만 객체가 없어서 에러 발생

**왜 `null`이 반환되나?**

[`camera-manager.js`](file:///d:/work/studywithme/public/js/camera-manager.js#L92-L97)의 `getVideoTrack()` 함수:

```javascript
getVideoTrack() {
    if (this.stream) {
        return this.stream.getVideoTracks()[0];
    }
    return null;  // ← stream이 없으면 null 반환!
}
```

카메라가 켜져있지 않으면 `this.stream`이 `null`이므로 `null`을 반환합니다.

## 수정 계획

### 수정할 파일

#### [agora-rtc-client.js](file:///d:/work/studywithme/public/js/agora-rtc-client.js)

**line 60-78**: `publish()` 함수에 안전 장치 추가

**변경 내용:**

1. `videoTrack`이 `null` 또는 유효하지 않은 경우 체크
2. 유효하지 않으면 새로운 카메라 트랙 자동 생성
3. 에러 메시지 개선

**수정 전:**

```javascript
async publish(videoTrack) {
    try {
        // If track is a raw MediaStreamTrack, create a custom video track
        if (!videoTrack.hasOwnProperty('_mediaStreamTrack')) {
            this.localTracks.videoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
        } else {
            this.localTracks.videoTrack = videoTrack;
        }
        // ...
    }
}
```

**수정 후:**

```javascript
async publish(videoTrack) {
    try {
        // videoTrack이 null이거나 유효하지 않으면 새로 생성
        if (!videoTrack) {
            console.log('[RTC] No video track provided, creating new camera track...');
            this.localTracks.videoTrack = await this.createCameraTrack();
        } else if (!videoTrack.hasOwnProperty('_mediaStreamTrack')) {
            // raw MediaStreamTrack인 경우
            this.localTracks.videoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
        } else {
            // 이미 Agora track인 경우
            this.localTracks.videoTrack = videoTrack;
        }
        // ...
    }
}
```

## 검증 계획

### 수동 테스트

**테스트 1: 기본 라이브 방송 시작**

1. 브라우저에서 앱 열기: `http://localhost:3000`
2. 카메라 권한 허용
3. `#btnGoLive` 버튼 클릭
4. **기대 결과:**
   - 에러 없이 버튼이 활성화 (초록색)
   - 콘솔에 `[RTC] Published video track` 메시지 출력
   - 라이브 상태 표시 나타남

**테스트 2: 카메라 꺼진 상태에서 라이브 시작**

1. 브라우저에서 앱 열기
2. 카메라 권한 거부 또는 카메라 끄기
3. `#btnGoLive` 버튼 클릭
4. **기대 결과:**
   - 새 카메라 트랙이 자동 생성됨
   - 콘솔에 `[RTC] No video track provided, creating new camera track...` 메시지
   - 방송 정상 시작

**테스트 3: 브라우저 콘솔 에러 확인**

- 위 두 테스트 중 콘솔에 `TypeError: e.addEventListener is not a function` 에러가 **나타나지 않아야 함**
