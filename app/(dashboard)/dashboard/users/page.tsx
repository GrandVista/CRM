"use client";

import { useEffect, useState } from "react";
import { AdminPageGuard } from "@/components/auth/admin-page-guard";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/api-client";
import { Loader2, UserPlus, KeyRound, Pencil } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff" as "admin" | "staff",
  });

  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [resetPwPassword, setResetPwPassword] = useState("");
  const [resetPwSubmitting, setResetPwSubmitting] = useState(false);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: "admin" | "staff";
    isActive: boolean;
  }>({ name: "", email: "", role: "staff", isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const res = await authFetch("/api/users");
    if (res.status === 403) {
      setError("无权限，仅管理员可访问");
      setUsers([]);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("加载用户列表失败，请稍后重试");
      setUsers([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as UserRow[];
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateRole(id: string, role: "admin" | "staff") {
    setActionError(null);
    setUpdatingId(id);
    const res = await authFetch(`/api/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUpdatingId(null);
    if (res.ok) {
      await loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { message?: string }).message ?? "修改角色失败");
    }
  }

  async function toggleStatus(id: string, isActive: boolean) {
    setActionError(null);
    setUpdatingId(id);
    const res = await authFetch(`/api/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setUpdatingId(null);
    if (res.ok) {
      await loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { message?: string }).message ?? "启用/禁用失败");
    }
  }

  async function handleAddUser() {
    setActionError(null);
    if (!addUserForm.email.trim() || !addUserForm.password) {
      setActionError("请填写邮箱和密码");
      return;
    }
    if (addUserForm.password.length < 6) {
      setActionError("密码至少 6 位");
      return;
    }
    setAddUserSubmitting(true);
    const res = await authFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: addUserForm.email.trim(),
        password: addUserForm.password,
        name: addUserForm.name.trim() || undefined,
        role: addUserForm.role,
      }),
    });
    setAddUserSubmitting(false);
    if (res.ok) {
      setAddUserOpen(false);
      setAddUserForm({ name: "", email: "", password: "", role: "staff" });
      await loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { message?: string }).message ?? "新增用户失败");
    }
  }

  async function handleEditUser() {
    if (!editUserId) return;
    if (!editForm.email.trim()) {
      setActionError("邮箱不能为空");
      return;
    }
    setActionError(null);
    setEditSubmitting(true);
    const res = await authFetch(`/api/users/${editUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim() || undefined,
        email: editForm.email.trim(),
        role: editForm.role,
        isActive: editForm.isActive,
      }),
    });
    setEditSubmitting(false);
    if (res.ok) {
      setEditUserId(null);
      await loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { message?: string }).message ?? "编辑用户失败");
    }
  }

  async function handleResetPassword() {
    if (!resetPwUserId || !resetPwPassword || resetPwPassword.length < 6) {
      setActionError("请输入至少 6 位新密码");
      return;
    }
    setActionError(null);
    setResetPwSubmitting(true);
    const res = await authFetch(`/api/users/${resetPwUserId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPwPassword }),
    });
    setResetPwSubmitting(false);
    if (res.ok) {
      setResetPwUserId(null);
      setResetPwPassword("");
      await loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { message?: string }).message ?? "重置密码失败");
    }
  }

  return (
    <AdminPageGuard>
      <div className="flex flex-col">
        <Header
          title="用户管理"
          description="新增账号、角色与启用状态、重置密码（仅管理员）"
        />
        <div className="p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>用户列表</CardTitle>
              <Button
                onClick={() => {
                  setAddUserOpen(true);
                  setActionError(null);
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                新增用户
              </Button>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">加载中...</span>
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive py-4" role="alert">
                  {error}
                </p>
              )}
              {actionError && (
                <p className="text-sm text-destructive py-2 mb-2" role="alert">
                  {actionError}
                </p>
              )}
              {!loading && !error && users.length === 0 && (
                <p className="text-sm text-muted-foreground py-8">暂无用户</p>
              )}
              {!loading && !error && users.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(v) =>
                              updateRole(u.id, v as "admin" | "staff")
                            }
                            disabled={updatingId === u.id}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">admin</SelectItem>
                              <SelectItem value="staff">staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.isActive ? "default" : "secondary"}
                          >
                            {u.isActive ? "启用" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === u.id}
                              onClick={() => {
                                setEditUserId(u.id);
                                setEditForm({
                                  name: u.name ?? "",
                                  email: u.email,
                                  role: u.role as "admin" | "staff",
                                  isActive: u.isActive,
                                });
                                setActionError(null);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === u.id}
                              onClick={() => toggleStatus(u.id, !u.isActive)}
                            >
                              {updatingId === u.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                  处理中
                                </>
                              ) : u.isActive ? (
                                "禁用"
                              ) : (
                                "启用"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingId === u.id}
                              onClick={() => {
                                setResetPwUserId(u.id);
                                setResetPwPassword("");
                                setActionError(null);
                              }}
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              重置密码
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 新增用户弹窗 */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">姓名</Label>
              <Input
                id="add-name"
                value={addUserForm.name}
                onChange={(e) =>
                  setAddUserForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="选填"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">邮箱</Label>
              <Input
                id="add-email"
                type="email"
                value={addUserForm.email}
                onChange={(e) =>
                  setAddUserForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="必填"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">密码</Label>
              <Input
                id="add-password"
                type="password"
                value={addUserForm.password}
                onChange={(e) =>
                  setAddUserForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="至少 6 位"
              />
            </div>
            <div className="grid gap-2">
              <Label>角色</Label>
              <Select
                value={addUserForm.role}
                onValueChange={(v) =>
                  setAddUserForm((f) => ({ ...f, role: v as "admin" | "staff" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="staff">staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUserOpen(false)}
              disabled={addUserSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleAddUser} disabled={addUserSubmitting}>
              {addUserSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  提交中
                </>
              ) : (
                "确定"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户弹窗 */}
      <Dialog
        open={editUserId !== null}
        onOpenChange={(open) => {
          if (!open) setEditUserId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">姓名</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="选填"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="必填"
              />
            </div>
            <div className="grid gap-2">
              <Label>角色</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, role: v as "admin" | "staff" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="staff">staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select
                value={editForm.isActive ? "true" : "false"}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, isActive: v === "true" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUserId(null)}
              disabled={editSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleEditUser} disabled={editSubmitting}>
              {editSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  保存中
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码弹窗 */}
      <Dialog
        open={resetPwUserId !== null}
        onOpenChange={(open) => {
          if (!open) setResetPwUserId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-password">新密码</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPwPassword}
                onChange={(e) => setResetPwPassword(e.target.value)}
                placeholder="至少 6 位"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPwUserId(null)}
              disabled={resetPwSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPwSubmitting}>
              {resetPwSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  提交中
                </>
              ) : (
                "确定"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageGuard>
  );
}
