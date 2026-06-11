# Junyoung Workout Experience

준영 담당 기능을 기존 페이지와 분리해서 먼저 구현하는 작업 공간입니다.

담당 범위:

- 운동 정확도에 따른 캐릭터 반응
- 성공, 보통, 교정 상태별 이펙트
- 운동 화면 녹화
- 운동 후 다시보기
- 결과 리포트 정리
- 병원 공유용 자료 다운로드

나중에 안정화되면 `pages/workout`, `features/live`, `components/live` 구조로 옮기거나 연결합니다.

```text
feedback/   정확도 상태와 피드백 계산
effects/    캐릭터 반응과 화면 이펙트 UI
recording/  운동 화면 녹화 hook과 컨트롤 UI
replay/     녹화 영상 다시보기 UI
report/     결과 리포트와 병원 공유 자료
```
