# React 컴포넌트 규칙

## 폴더 구조

- 컴포넌트는 `ComponentName/` 폴더에 두고, 진입 파일은 `ComponentName/ComponentName.tsx`를 기본으로 한다.
- 하위 전용 UI는 같은 트리에 둔다 (예: `VideoList/VideoListItem/VideoListItem.tsx`).
- 스타일은 같은 폴더의 `styled.ts`에 둔다.
- 해당 컴포넌트에서만 쓰이는 커스텀 훅은 같은 폴더의 `hooks.ts`에 둔다.

## 파일 내 순서 (위 → 아래)

1. `'use client'` — 클라이언트 훅·이벤트·브라우저 API를 쓸 때만 최상단에 둔다.
2. 외부·alias·상대 import.
3. `interface …Props` 등 props 타입.
4. 컴포넌트 함수 (props는 상단에서 destructure).
5. `export default …`

## Import 순서

1. `react`, `react-dom` 등 외부 패키지.
2. 앱 alias `@/…`.
3. 상대 경로: 형제 컴포넌트 → `import * as S from "./styled"`는 마지막.

## 네이밍

- 컴포넌트·파일명: PascalCase.
- props 인터페이스: `ComponentNameProps`.
- 훅: `use` 접두사, camelCase.
- 상수: `UPPER_SNAKE_CASE`. 그 외: camelCase.

## Export

- 화면·피처 컴포넌트: default export.
- 유틸·순수 함수 모듈: named export.
- `styled.ts`의 스타일 컴포넌트: named export.

## TypeScript

- 컴포넌트 props는 `interface`로 정의한다.
- `any` 사용 금지. 로컬 `interface` 또는 서비스 타입을 쓴다.
- null/undefined는 `?.`, `??`로 처리한다.
- 타입 단언(`as`)은 불가피한 경우에만 쓴다.

## 컴포넌트 구조

- 클래스 컴포넌트는 쓰지 않는다.
- TSX 안에서 fetch 직접 호출 금지. 서비스·훅으로 분리한다.
- `React.memo`, `useMemo`, `useCallback`은 실제 성능 문제가 있을 때만 쓴다.
