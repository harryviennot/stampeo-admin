"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Building2,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  ScrollText,
  Shield,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Top section — no label. The three surfaces opened most often.
const mainItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Billing", icon: Wallet },
  { href: "/businesses", label: "Businesses", icon: Building2 },
];

// "CONTENT" — what merchants and end customers actually see.
const contentItems: NavItem[] = [
  { href: "/card-designs", label: "Card Designs", icon: CreditCard },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/changelog", label: "Changelog", icon: ScrollText },
];

// "PLATFORM" — accounts, audit trail, infrastructure.
const platformItems: NavItem[] = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/access-sessions", label: "Access Sessions", icon: History },
  { href: "/certificates", label: "Certificates", icon: ShieldCheck },
];

/**
 * Prefix-match on a path SEGMENT, never a bare string prefix: a plain
 * `startsWith("/emails")` would also light up a future `/emails-archive`.
 * `/emails/flows` (not itself a nav entry) correctly keeps Emails active.
 */
function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.href);
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.label}
          className={cn(
            "h-9 transition-colors",
            active
              ? "bg-accent/10 text-accent font-semibold hover:bg-accent/15 hover:text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link href={item.href}>
            <Icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <Link
          href="/"
          className="flex items-center gap-2 overflow-hidden font-semibold"
        >
          <Shield className="h-5 w-5 shrink-0 text-accent" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Stampeo Admin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {mainItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Content
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {contentItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Platform
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {platformItems.map(renderNavItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarSeparator className="mx-0 w-auto data-[orientation=horizontal]:w-auto" />
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
