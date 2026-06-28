import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Contact,
  Globe,
  Home,
  LogOut,
  Package,
  ScrollText,
  ShoppingCart,
  Tags,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { auth } from "@/core/auth";
import { useMe } from "@/api/user/query-hooks";
import { RoleBadge } from "@/components/shared/role-badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const WEBSITE_URL = "https://goatrise.com";

const navGroups: NavGroup[] = [
  {
    label: "System",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Categories", url: "/categories", icon: Tags },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Customers", url: "/customers", icon: Contact },
    ],
  },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const [avatarError, setAvatarError] = useState(false);

  function handleLogout() {
    auth.signOut();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          {me?.avtUrl && !avatarError ? (
            <img
              src={me.avtUrl}
              alt={me.fullName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="size-5" />
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-semibold">
              {me?.fullName}
            </span>
            {me?.role && <RoleBadge role={me.role} />}
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup className="mt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Home"
                  className={cn(
                    pathname === "/" &&
                    "bg-primary! text-primary-foreground! hover:bg-primary! hover:text-primary-foreground!"
                  )}
                >
                  <Link to="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          active &&
                          "bg-primary! text-primary-foreground! hover:bg-primary! hover:text-primary-foreground!"
                        )}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={WEBSITE_URL} target="_blank" rel="noreferrer">
                <Globe />
                <span>Go to Website</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
