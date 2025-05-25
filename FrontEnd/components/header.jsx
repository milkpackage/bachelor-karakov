"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#fafafa] dark:bg-[#0c0c10] backdrop-blur supports-[backdrop-filter]:bg-[#fafafa]/60 dark:border-[#2a2a3c]">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
              <span className="text-xl" role="img" aria-label="flower">
                🌼
              </span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Serenify</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("dashboard")
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("emotions")
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }}
          >
            Emotions
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("tests")
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }}
          >
            Tests
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("chat")
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }}
          >
            Chat
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <User className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="flex w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" className="hidden md:flex" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
              <Button className="hidden md:flex" onClick={() => router.push("/auth/register")}>
                Sign Up
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById("dashboard")
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                setIsMenuOpen(false)
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById("emotions")
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                setIsMenuOpen(false)
              }}
            >
              Emotions
            </Link>
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById("tests")
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                setIsMenuOpen(false)
              }}
            >
              Tests
            </Link>
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById("chat")
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                setIsMenuOpen(false)
              }}
            >
              Chat
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" onClick={() => router.push("/auth/login")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/auth/register")}>Sign Up</Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
