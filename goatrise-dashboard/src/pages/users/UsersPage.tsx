import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUp, Eye, Plus, Search, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCreateUser, useMe, useUpdateUserRole, useUsers } from "@/api/user/query-hooks.ts";
import type { CreateUserRequest, User, UserRole } from "@/api/user/api.ts";
import { RoleBadge, ROLE_LABELS } from "@/components/shared/role-badge";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

const PAGE_SIZE = 20;
const ROLE_ALL = "ALL";

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: ROLE_LABELS.CUSTOMER, value: "CUSTOMER" },
  { label: ROLE_LABELS.STAFF, value: "STAFF" },
  { label: ROLE_LABELS.ADMIN, value: "ADMIN" },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Name (A→Z)", value: "fullName:ASC" },
  { label: "Name (Z→A)", value: "fullName:DESC" },
  { label: "Email (A→Z)", value: "email:ASC" },
  { label: "Email (Z→A)", value: "email:DESC" },
];

export default function UsersPage() {
  // ----- query states (mirror backend /api/users filters) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | typeof ROLE_ALL>(ROLE_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [offset, setOffset] = useState(0);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [isUpdateRoleDialogOpen, setIsUpdateRoleDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // chỉ search khi nhấn Enter, không gọi request mỗi lần gõ
  function commitSearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  const params = useMemo(
    () => ({
      search: search || undefined,
      role: role === ROLE_ALL ? undefined : role,
      sort,
      offset,
      limit: PAGE_SIZE,
    }),
    [search, role, sort, offset],
  );

  const usersQuery = useUsers(params);
  const meQuery = useMe();
  const isAdmin = meQuery.data?.role === "ADMIN";

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasPrevious = offset > 0;
  const hasNext = (usersQuery.data?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Users</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search ID, name, email or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch();
            }}
            className="bg-card pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={commitSearch}
            aria-label="Search"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <Search className="size-3.5" />
          </Button>
        </div>

        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as UserRole | typeof ROLE_ALL);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROLE_ALL}>All roles</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-44 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Button
            type="button"
            className="ml-auto"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            New User
          </Button>
        )}
      </div>

      {/* ----- table ----- */}
      {usersQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-destructive text-center">
                    Failed to load users.
                  </TableCell>
                </TableRow>
              ) : !usersQuery.data || usersQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                usersQuery.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="">
                      <span
                        className="block truncate text-xs max-w-36"
                        title={user.id}
                      >
                        {user.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={user} />
                        <span>{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNum ?? "—"}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Change role"
                            title="Change role"
                            onClick={() => {
                              setRoleUser(user);
                              setIsUpdateRoleDialogOpen(true);
                            }}
                          >
                            <ChevronsUp className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----- pagination ----- */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Page {page}
          {usersQuery.isFetching ? " · updating..." : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious || usersQuery.isFetching}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || usersQuery.isFetching}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <UpdateRoleDialog
        open={isUpdateRoleDialogOpen}
        user={roleUser}
        onClose={() => setIsUpdateRoleDialogOpen(false)}
        onSuccess={() => usersQuery.refetch()}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => usersQuery.refetch()}
      />
    </div>
  );
}

function UpdateRoleDialog({
  open,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const updateRoleMutation = useUpdateUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>("CUSTOMER");
  // select content portal ra ngoài dialog + set pointer-events:none lên phần
  // ngoài select -> cú click đóng dropdown bị Dialog hiểu nhầm là click ngoài.
  // Phân biệt bằng: select đang mở / vừa đóng trong 1 khoảng ngắn (chịu được
  // cả trường hợp dialog đóng trễ ở tick sau).
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  // reset select về role hiện tại mỗi khi mở user khác
  useEffect(() => {
    if (user) setSelectedRole(user.role);
  }, [user]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        // bỏ qua close oan do thao tác với select
        if (selectOpenRef.current || Date.now() - selectClosedAtRef.current < 300) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update {user?.fullName}'s role</DialogTitle>
        </DialogHeader>

        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as UserRole)}
          onOpenChange={(selectOpen) => {
            selectOpenRef.current = selectOpen;
            if (!selectOpen) selectClosedAtRef.current = Date.now();
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={
              updateRoleMutation.isPending || !user || selectedRole === user.role
            }
            onClick={() => {
              if (!user) return;
              updateRoleMutation.mutate(
                { userId: user.id, role: selectedRole },
                {
                  onSuccess: () => {
                    toast.success(
                      `Updated ${user.fullName}'s role to ${ROLE_LABELS[selectedRole]}`,
                    );
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    toast.error(
                      isAxiosError(error)
                        ? error.response?.data || error.message
                        : "Failed to update role",
                    );
                    onClose();
                  },
                },
              );
            }}
          >
            {updateRoleMutation.isPending && <Spinner />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createUserMutation = useCreateUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [phoneNum, setPhoneNum] = useState("");
  const [avtUrl, setAvtUrl] = useState("");
  // cùng lý do với UpdateRoleDialog: tránh thao tác select bị Dialog hiểu là click ngoài
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  // reset form mỗi khi mở lại dialog
  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setRole("CUSTOMER");
      setPhoneNum("");
      setAvtUrl("");
    }
  }, [open]);

  const canSubmit = fullName.trim().length > 0 && email.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (selectOpenRef.current || Date.now() - selectClosedAtRef.current < 300) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Full name</FieldLabel>
            <Input
              placeholder="e.g. Nguyen Van A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Email</FieldLabel>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Role</FieldLabel>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              onOpenChange={(selectOpen) => {
                selectOpenRef.current = selectOpen;
                if (!selectOpen) selectClosedAtRef.current = Date.now();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Phone</FieldLabel>
            <Input
              placeholder="0xxxxxxxxx"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Avatar URL</FieldLabel>
            <Input
              placeholder="https://..."
              value={avtUrl}
              onChange={(e) => setAvtUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={createUserMutation.isPending || !canSubmit}
            onClick={() => {
              const request: CreateUserRequest = {
                fullName: fullName.trim(),
                email: email.trim(),
                role: role,
                phoneNum: phoneNum.trim() || undefined,
                avtUrl: avtUrl.trim() || undefined,
              };
              createUserMutation.mutate(request, {
                onSuccess: (user) => {
                  toast.success(`Created user ${user.fullName}`);
                  onSuccess();
                  onClose();
                },
                onError: (error) => {
                  toast.error(
                    isAxiosError(error)
                      ? error.response?.data || error.message
                      : "Failed to create user",
                  );
                },
              });
            }}
          >
            {createUserMutation.isPending && <Spinner />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserAvatar({ user }: { user: User }) {
  const [error, setError] = useState(false);
  return user.avtUrl && !error ? (
    <img
      src={user.avtUrl}
      alt={user.fullName}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="size-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
      <UserIcon className="size-4" />
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {children}{" "}
      {required ? (
        <span className="text-destructive">*</span>
      ) : (
        <span className="text-muted-foreground text-xs font-normal">
          (optional)
        </span>
      )}
    </label>
  );
}
