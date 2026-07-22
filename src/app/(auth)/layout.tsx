import { CHURCH_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-2xl font-bold mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-foreground">ChurchConnect</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {CHURCH_NAME}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
