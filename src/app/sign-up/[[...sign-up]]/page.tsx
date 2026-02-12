import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
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
