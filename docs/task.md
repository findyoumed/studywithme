# 라이브 버튼 에러 수정 작업

## 조사 단계

- [x] 에러 메시지 확인
- [x] `live-manager.js` 파일 검토
- [x] `agora-rtc-client.js` 파일 검토
- [x] `camera-manager.js` 파일 검토
- [x] 원인 파악: `getVideoTrack()`이 `null` 반환

## 수정 단계

- [x] `agora-rtc-client.js`의 `publish()` 함수 수정
  - [x] `videoTrack` null 체크 추가
  - [x] null일 때 자동으로 새 트랙 생성
  - [x] 에러 메시지 개선

## 검증 단계

- [x] 카메라 켜진 상태에서 라이브 버튼 클릭 테스트
- [x] 카메라 꺼진 상태에서 라이브 버튼 클릭 테스트
- [x] 콘솔 에러 없는지 확인
- [x] UI 코드 vs 실제 화면 일치 검증
