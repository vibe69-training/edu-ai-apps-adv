---
name: activity-validator
description: 학습활동 추천 JSON의 형식과 시간 조건을 검사한다
---

# activity-validator

## 절차

1. 활동 JSON 배열을 읽는다. 배열이 없으면 중단하고 사용자에게 파일 경로를 확인한다.
2. `api/validate.js`의 `validateActivities(response, request)`를 실행한다.
   - `response`는 `{ activities }` 형태로 만든다.
   - `request`는 `{ duration }` 형태로 만든다. `duration`은 수업 시간(분)이다.
3. 결과가 `true`이면 통과로 보고한다. `false`이면 아래 기준으로 실패 항목과 이유를 찾아 표로 보고한다.

## 검사 기준

`validateActivities()`는 전체 결과만 `true` 또는 `false`로 반환한다. 항목별 이유는 다음 기준을 각 활동에 직접 적용해 구한다.

| 기준 | 실패 이유 예시 |
|------|----------------|
| 활동이 정확히 3개다 | 활동 개수 오류 (현재 개수 표시) |
| 필수 항목 `name`, `goal`, `steps`, `materials`, `minutes`가 모두 있다 | 누락 항목 이름 표시 |
| 전체 `minutes` 합계가 `request.duration` 이하다 | 합계 초과 (합계와 수업 시간 표시) |

시간 합계 초과는 활동 항목 하나의 문제가 아니므로 해당 행에 "합계 N분, 수업 M분"으로 적는다.

## 보고 형식

| 항목 번호 | 실패 이유 |
|-----------|-----------|
| 2 | 필수 항목 누락: goal |

실패 항목이 없으면 "전체 통과"와 활동 개수, 시간 합계를 보고한다.

## 제약

- 코드를 수정하지 않는다. 검사만 한다.
- 활동 개수가 3개가 아니면 항목별 검사 결과와 함께 그 사실을 먼저 보고한다.
