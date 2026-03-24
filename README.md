# 라포 (Rapport) — 프론트엔드

> AI 기반 심리 상담 전 사전 점검 & 상담사 매칭 플랫폼

라포(Rapport)는 심리 상담을 받기 전 AI 챗봇과의 대화를 통해 현재 심리 상태를 파악하고, 그 결과를 바탕으로 적합한 상담사를 추천·예약할 수 있는 서비스입니다. 내담자와 상담사 모두를 위한 전용 화면을 제공하며, 웹과 모바일(Capacitor) 환경을 함께 지원합니다.

---

## 기술 스택

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-latest-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-latest-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-latest-000000?style=flat-square&logo=react&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-latest-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-latest-119EFF?style=flat-square&logo=capacitor&logoColor=white)

| 분류 | 기술 |
|---|---|
| UI 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS |
| UI 상태 관리 | Zustand |
| 서버 상태 관리 | TanStack Query |
| 모바일 래핑 | Capacitor |

---

## 시작하기

### 사전 요구사항

- **Node.js 20** 이상
- **백엔드 서버**가 `http://localhost:8080`에서 실행 중이어야 합니다

### 1. 레포 클론

```bash
git clone https://github.com/your-org/rapport-frontend.git
cd rapport-frontend
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.example`을 복사해서 `.env.local`을 생성합니다.

```bash
cp .env.example .env.local
```

`.env.local`을 열고 아래와 같이 설정합니다.

```env
VITE_API_URL=http://localhost:8080
```

> 백엔드 서버 주소가 다른 경우 해당 주소로 변경하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 **http://localhost:5173** 에 접속합니다.

---

## 환경변수

| 변수명 | 설명 | 로컬 기본값 |
|---|---|---|
| `VITE_API_URL` | 백엔드 API 서버 주소 | `http://localhost:8080` |

> **Vercel 배포 시**: 대시보드 → Settings → Environment Variables에서 `VITE_API_URL`을 운영 서버 주소로 설정하세요.

---

## 주요 화면

| 화면 | 경로 | 접근 권한 |
|---|---|---|
| 랜딩 페이지 | `/` | 비로그인 |
| 로그인 | `/login` | 비로그인 |
| 회원가입 | `/signup` | 비로그인 |
| AI 챗봇 대화 | `/chat` | 내담자 |
| 리포트 목록 | `/reports` | 내담자 |
| 상담사 탐색 | `/counselors` | 내담자 |
| 예약하기 | `/booking/:counselorId` | 내담자 |
| 예약 관리 | `/my/bookings` | 내담자 |
| 상담사 대시보드 | `/counselor/dashboard` | 상담사 |
| 상담사 예약 관리 | `/counselor/bookings` | 상담사 |

---

## 디렉토리 구조

```
rapport-frontend/
├── src/
│   ├── api/          # API 호출 함수 (TanStack Query)
│   ├── components/
│   │   ├── ui/       # 버튼, 인풋, 모달 등 기본 UI 컴포넌트
│   │   └── layout/   # 헤더, 네비게이션 등 레이아웃 컴포넌트
│   ├── pages/        # 라우트 단위 화면 컴포넌트
│   ├── stores/       # Zustand 스토어
│   ├── types/        # TypeScript 타입 정의
│   └── utils/        # 공통 유틸 함수
├── .env.example
└── .gitignore
```

---

## 상태 관리

| 라이브러리 | 역할 | 예시 |
|---|---|---|
| **Zustand** | UI 상태 | 로그인 유저 정보, 모달 열림 여부, 사이드바 상태 |
| **TanStack Query** | 서버 상태 | API 데이터 캐싱, 로딩/에러 처리, 리페치 |

- 서버에서 가져오는 데이터는 반드시 **TanStack Query**로 관리합니다.
- 클라이언트 전용 UI 상태만 **Zustand**에 저장합니다.
- 두 라이브러리의 역할을 혼용하지 않도록 주의하세요.

---

## 브랜치 전략

```
main            → 프로덕션 배포 (PR + 1명 승인 필수, 직접 push 금지)
develop         → 개발 통합 브랜치
feature/기능명  → 기능 개발 브랜치
fix/버그명      → 버그 수정 브랜치
```

- `main`에 직접 push하지 않습니다.
- 작업 완료 후 `develop`으로 PR을 올리고, QA 완료 후 `main`으로 병합합니다.

---

## 커밋 메시지 컨벤션

```
<타입>: <변경 내용 요약>
```

| 타입 | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `chore` | 설정, 패키지 등 기타 작업 |
| `refactor` | 기능 변화 없는 코드 개선 |
| `docs` | 문서 수정 |
| `style` | 포매팅, 세미콜론 등 코드 스타일 |
| `test` | 테스트 코드 추가/수정 |

**예시**

```
feat: 챗봇 대화 화면 구현
fix: 상담사 목록 필터 초기화 버그 수정
chore: Tailwind 설정 추가
refactor: 예약 API 훅 분리
docs: README 환경변수 설명 추가
```

---

## 빌드 & 배포

### 로컬 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다. 빌드 미리보기:

```bash
npm run preview
```

### 운영 배포

- `main` 브랜치에 push되면 **Vercel**이 자동으로 빌드 및 배포합니다.
- Vercel 대시보드 → Settings → Environment Variables에서 `VITE_API_URL`을 운영 서버 주소로 설정해야 합니다.
- 배포 상태는 Vercel 대시보드 또는 GitHub PR의 배포 체크에서 확인할 수 있습니다.