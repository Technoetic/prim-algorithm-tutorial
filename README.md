# 프림 알고리즘 — 단계별 실행

최소 신장 트리(MST)를 만드는 **프림(Prim) 알고리즘**을 단계별로 실행해볼 수 있는 인터랙티브 플레이그라운드.

라이브 데모: https://technoetic.github.io/prim-algorithm-tutorial/

## 특징
- 의존성 0 (바닐라 JS + CSS), 정적 단일 페이지
- SVG 렌더 + 상태별 색 인코딩 (frontier·in-tree·current·rejected)
- 세 가지 프리셋: 광케이블 / 전력망 / 미로(4×3 격자)
- 재생·일시정지·스텝·속도(×0.5/×1/×1.5)·리셋
- 키보드 단축키: `Space`·`←/→`·`R`·`1/2/3`
- WCAG 2 AA 준수

## 로컬 실행
정적 파일 서버라면 무엇이든 동작합니다. 예:
```bash
python -m http.server 4173
# http://127.0.0.1:4173
```

## 구조
- `index.html` — 엔트리
- `src/` — ES 모듈 6개 + CSS 5개
- `presets/` — 그래프 프리셋 3개(JSON)

## 라이선스
MIT
