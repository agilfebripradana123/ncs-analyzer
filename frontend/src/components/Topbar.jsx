import { Bell, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Topbar({ title, breadcrumb }) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="bg-surface border-b border-border h-16 fixed top-0 left-0 md:left-60 right-0 z-10 flex items-center justify-between px-6 pl-16 md:pl-6">
      <div>
        {breadcrumb ? (
          <div className="text-sm text-text-secondary">{breadcrumb}</div>
        ) : null}
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-surface-secondary rounded-md transition-colors"
          aria-label="Search"
        >
          <Search size={20} className="text-text-secondary" />
        </button>
        <button
          className="p-2 hover:bg-surface-secondary rounded-md transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-text-secondary" />
        </button>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-surface-secondary px-3 py-2 rounded-md transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-text-primary">
                {user?.name}
              </span>
              <span className="text-xs text-text-secondary capitalize">
                {user?.role}
              </span>
            </div>
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-sm py-1 z-20">
                <button
                  onClick={() => {
                    logout()
                    setDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
