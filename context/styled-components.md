# styled-components 규칙

## 배치

- 스타일 정의는 같은 디렉터리의 `styled.ts`에만 둔다.
- TSX 파일 안에 `styled.div` 등을 직접 쓰지 않는다.

## styled.ts 패턴

- `import { styled, css } from 'styled-components'` (`css`는 실제로 쓸 때만 import).
- 스타일 컴포넌트는 named export (예: `export const Wrapper = styled.div\`...\``).
- 이름은 시맨틱하게: `Wrapper`, `Title`, `List`, `Item`, `Card` 등.
- 파일 내 순서는 컴포넌트 트리 위 → 아래 (부모 → 자식) 순으로 정렬한다.

## 동적 스타일

- 조건 스타일은 템플릿 리터럴 안에서 props로 분기한다.
- DOM에 내려가면 안 되는 스타일 props는 transient props (`$` 접두사)를 쓴다 (예: `$isActive`, `$variant`).
- 반복되는 CSS 덩어리는 `css` 헬퍼로 묶어 재사용한다.

## TSX에서 사용

- `import * as S from "./styled"` 후 `<S.Wrapper>` 형태로만 사용한다.
- 인라인 `style={{ }}`는 JS에서만 계산 가능한 동적 값 등 예외적인 경우에만 쓴다.
- TSX 내에 새 `styled.*` 컴포넌트를 직접 선언하지 않는다.

## 토큰·레이아웃

- 색·간격·폰트는 기존 테마·토큰·변수가 있으면 그걸 따른다.
- 매직 넘버보다 기존 spacing 토큰·변수를 우선한다. 없으면 4의 배수(4, 8, 16…)를 쓴다.
