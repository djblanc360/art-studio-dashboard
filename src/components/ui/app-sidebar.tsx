import { Link } from "@tanstack/react-router"
import { LayoutDashboard, KanbanSquare, Calendar, FlaskConical, Database, Wrench, PanelLeft, Bell } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet"

const menuItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Command Center",
  },
  {
    href: "/dashboard/operations",
    icon: KanbanSquare,
    label: "Operations",
  },
  {
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendar",
  },
  {
    href: "/dashboard/the-lab",
    icon: FlaskConical,
    label: "The Lab",
  },
  {
    href: "/dashboard/banx-database",
    icon: Database,
    label: "BANX Database",
  },
  {
    href: "/dashboard/workbench",
    icon: Wrench,
    label: "Workbench",
  },
]

const NavLink = ({ href, icon: Icon, label }: (typeof menuItems)[0]) => (
  <Link
    to={href}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
)

export function AppSidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/piggybanx-bolt.png" width={24} height={24} alt="PiggyBanx" />
            <span className="">PIGGY COMMAND</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8 bg-transparent">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {menuItems.map((item) => (
              <NavLink key={item.label} {...item} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

export function AppSidebarMobile() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
            <img src="/piggybanx-bolt.png" width={24} height={24} alt="PiggyBanx" />
            <span>PIGGY COMMAND</span>
          </Link>
          {menuItems.map((item) => (
            <NavLink key={item.label} {...item} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
