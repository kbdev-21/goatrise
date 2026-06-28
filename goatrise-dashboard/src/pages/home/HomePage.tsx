import { useMe } from "@/api/user/query-hooks.ts";
import { RoleBadge } from "@/components/shared/role-badge";

export default function HomePage() {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-medium">Home Page</h1>
      {me && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          {me.fullName} <RoleBadge role={me.role} />
        </p>
      )}
    </div>
  );
}
