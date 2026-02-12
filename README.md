# VibeBoard

**20자로 표현하는 실시간 상태 보드**

짧지만 강렬하게, 지금 이 순간을 공유하는 소셜 플랫폼입니다.

## 주요 기능

- **실시간 메시지 피드**: Supabase Realtime으로 즉시 반영되는 메시지
- **간결한 표현**: 최대 20자 제한으로 핵심만 담은 상태 공유
- **안전한 인증**: Clerk를 통한 간편하고 안전한 사용자 인증
- **미니멀 UI**: 다크 테마 기반의 현대적이고 깔끔한 인터페이스
- **개인 대시보드**: 본인이 작성한 메시지 관리

## 기술 스택

### Core

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Runtime**: Node.js 20+

### UI/Styling

- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Components**: [Shadcn UI](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Animations**: [Framer Motion](https://www.framer.com/motion)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)

### Backend & Data

- **Authentication**: [Clerk](https://clerk.com)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + Realtime)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)

### Development

- **Validation**: [Zod](https://zod.dev)
- **Forms**: [React Hook Form](https://react-hook-form.com)
- **Utilities**: [es-toolkit](https://github.com/toss/es-toolkit), [date-fns](https://date-fns.org)
- **Pattern Matching**: [ts-pattern](https://github.com/gvergnaud/ts-pattern)

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값을 설정합니다:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabase 데이터베이스 설정

Supabase 프로젝트에서 다음 SQL을 실행하여 테이블을 생성합니다:

```sql
-- messages 테이블 생성
create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  message text not null check (char_length(message) <= 20),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 활성화
alter table messages enable row level security;

-- 읽기 정책: 모든 사용자가 메시지를 읽을 수 있음
create policy "Anyone can view messages"
  on messages for select
  using (true);

-- 생성 정책: 인증된 사용자만 메시지 생성 가능
create policy "Authenticated users can create messages"
  on messages for insert
  with check (true);

-- 삭제 정책: 본인의 메시지만 삭제 가능
create policy "Users can delete their own messages"
  on messages for delete
  using (auth.uid()::text = user_id);

-- Realtime 활성화
alter publication supabase_realtime add table messages;
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── actions.ts         # Server Actions
│   ├── dashboard/         # 개인 대시보드 페이지
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── vibe-input.tsx    # 메시지 입력 컴포넌트
│   ├── vibe-list.tsx     # 메시지 목록 컴포넌트
│   └── ui/               # Shadcn UI 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   └── utils.ts          # 공통 유틸리티
└── middleware.ts          # Clerk 미들웨어
```

## 주요 명령어

```bash
# 개발 서버 실행 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint
```

## 배포

Vercel을 통한 배포를 권장합니다:

1. GitHub에 프로젝트를 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 Import
3. 환경 변수 설정
4. 자동 배포 완료

## 라이선스

MIT
# vibe_board
