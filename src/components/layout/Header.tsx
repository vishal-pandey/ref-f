
"use client";

import Link from "next/link";
import { Briefcase, LogIn, LogOut, UserCircle, UserCog, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, logout, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/"); // Ensure redirect to home after logout, AuthContext also handles /login redirect
  };

  const getInitials = (fullName?: string | null, email?: string | null, mobile?: string | null) => {
    if (fullName) {
        const names = fullName.split(' ');
        if (names.length > 1) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    if (mobile) return mobile.substring(mobile.length - 4, mobile.length - 2).toUpperCase(); // Less ideal, but a fallback
    return "U";
  };
  
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors">
          <Briefcase className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-semibold">ReferralNetwork</h1>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Jobs</Link>
          </Button>
          {isLoading ? (
             <div className="h-10 w-20 bg-muted rounded-md animate-pulse"></div>
          ) : user && isAdmin ? (
            <Button variant="ghost" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}

          {isLoading ? (
             <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.full_name, user.email, user.mobile_number)}`} alt={user.full_name || user.email || user.mobile_number || "User"} data-ai-hint="avatar user" />
                    <AvatarFallback>{getInitials(user.full_name, user.email, user.mobile_number)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || user.email || user.mobile_number}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      User {isAdmin ? '(Admin)' : ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push('/complete-profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                {isAdmin && (
                   <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
