# [bitflow] 개선 - PC 대시보드 - 032001 구현 계획

## 전제 및 범위
- 참고 문서 확인 결과: `context-summary.md`는 존재, `design-spec.md`는 현재 미존재.
- 본 계획은 **데스크탑 `/desktop` 메인 개요 화면**의 "시장 체온" 영역 hover 상태에서 스크롤 입력을 차단하는 quick-fix 범위로 한정.
- 역할 경계에 따라 본 문서는 조사/계획만 포함하며, 코드 구현/테스트 실행/릴리즈는 포함하지 않음.

## Phase 1: 현행 동작/요구사항 확정
- "시장 체온" 대상 영역을 `src/components/desktop/desktop-home-page.tsx` 내 캐러셀 Slide 1 블록으로 고정.
- 스크롤 차단의 기준 이벤트를 `wheel`(마우스 휠/트랙패드 스크롤)로 정의.
- 차단 적용 조건을 명확화.
- 조건 1: 포인터가 시장 체온 영역 위에 있을 때만 적용.
- 조건 2: 데스크탑 개요 페이지에서만 적용(모바일/다른 페이지 영향 없음).

## Phase 2: 스크롤 차단 로직 설계
- `desktop-home-page.tsx`에 hover 상태를 추적할 수 있는 로컬 상태 또는 ref(`isMarketTempHovered`) 추가.
- 시장 체온 컨테이너(Slide 1 root)에 `onMouseEnter`/`onMouseLeave` 핸들러를 연결.
- 같은 컨테이너(또는 상위 action 래퍼)에 `onWheel`(또는 `onWheelCapture`) 핸들러를 연결하여,
- hover=true일 때 `event.preventDefault()`로 페이지 스크롤 전파를 차단.
- slide가 이벤트 탭(Slide 2)일 때는 기존 스크롤 동작 유지되도록 조건 분기.
- 기존 자동 슬라이드(`paused`, `slide`) 동작은 변경하지 않음.

## Phase 3: 영향도 점검 및 회귀 방지
- 상세 카드 영역(`max-h-[180px] overflow-y-auto`)과의 충돌 여부를 검토.
- 우선 정책: 요청 문구("스크롤 안하도록")를 우선해 hover 중 wheel 차단.
- 필요 시 후속안: 내부 상세 스크롤은 허용하고 페이지 스크롤 체인만 막도록 `overscroll-behavior` 기반 미세 조정.
- 접근성/조작성 점검.
- 키보드 탐색(탭 이동, 버튼 클릭) 영향 없어야 함.
- 클릭 인터랙션(지표 선택/해제, 슬라이드 탭 전환) 영향 없어야 함.

## Phase 4: 검증 및 산출물 정리
- 수동 검증 시나리오를 기준으로 기대 결과를 체크리스트화.
- 변경 이유/범위/리스크를 `implementation-summary.md` 및 `test-report.md`에 연결 가능한 형태로 정리.
- quick-fix 특성상 변경 파일 최소화(단일 컴포넌트 우선) 원칙 유지.

## 필요한 파일 목록 및 예상 변경사항
- `src/components/desktop/desktop-home-page.tsx`
- 시장 체온 Slide 컨테이너에 hover + wheel 차단 이벤트 처리 추가.
- 필요 시 이벤트 핸들러 가독성을 위한 내부 함수(예: `handleMarketTempWheel`) 분리.
- (선택) `src/app/globals.css`
- 코드만으로 충분하지 않을 경우에 한해 `overscroll-behavior` 보조 스타일 추가 검토.

## 예상 기술적 고려사항
- React `onWheel` 이벤트에서 `preventDefault()` 적용 시, 해당 영역 내 기본 스크롤도 함께 차단될 수 있음.
- 트랙패드 관성 스크롤 입력까지 포함해 차단되어야 일관된 UX가 보장됨.
- 범위를 넓히면(페이지 전체 lock) 부작용이 커지므로 시장 체온 영역으로 국소화 필요.
- 캐러셀 transform 애니메이션과 이벤트 핸들러가 충돌하지 않도록 불필요한 re-render를 피하는 구조가 바람직.

## 테스트 전략
- 수동 테스트(필수)
- `/desktop` 접속 후 Slide 1(시장 체온) 영역 hover 상태에서 휠 입력 시 페이지 스크롤이 발생하지 않는지 확인.
- 같은 화면에서 마우스가 시장 체온 영역 밖으로 나가면 기존 페이지 스크롤이 정상 동작하는지 확인.
- Slide 2(이벤트)에서는 기존 스크롤 동작이 유지되는지 확인.
- 지표 카드 클릭, 상세 패널 열기/닫기, 자동 슬라이드 일시정지/재생 기능이 정상인지 회귀 확인.
- 정적 검증(권장)
- `npm run lint`
- `npm run typecheck`
- 브라우저 확인 범위
- 최소 Chrome(Desktop), Safari(Desktop)에서 wheel/trackpad 입력 동작 비교 확인.

## 리스크 및 대응
- 리스크: 상세 패널 내부 스크롤까지 막혀 정보 열람성이 떨어질 수 있음.
- 대응: 요청 우선 반영 후, 필요 시 후속 이슈로 "내부 스크롤 허용 + 페이지 스크롤만 차단" 보완.
