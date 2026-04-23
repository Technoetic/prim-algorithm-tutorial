# 프림 알고리즘 — 단계별 실행

최소 신장 트리(MST)를 만드는 **프림(Prim) 알고리즘**을 단계별로 실행해볼 수 있는 인터랙티브 플레이그라운드.

## 특징
- 의존성 0 (바닐라 JS + CSS), 정적 단일 페이지
- SVG 렌더 + 상태별 색 인코딩 (frontier·in-tree·current·rejected)
- 세 가지 프리셋: 광케이블 / 전력망 / 미로(4×3 격자)
- 재생·일시정지·스텝·속도(×0.5/×1/×1.5)·리셋
- 키보드 단축키: `Space`·`←/→`·`R`·`1/2/3`
- 한국어 내러티브 토스트, WCAG 2 AA 준수

## 실행

### 방법 A — 로컬 서버
```bash
node scripts/serve-for-test.cjs
# http://127.0.0.1:4173
```

### 방법 B — 오프라인 단일 파일
`dist/single.html`을 더블클릭하면 브라우저에서 바로 동작합니다.

## 테스트
```bash
npm test                # vitest 유닛
npx playwright test     # E2E
```

## 라이선스
MIT
