import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800",
          },
        }}
      />
    </div>
  );
}
