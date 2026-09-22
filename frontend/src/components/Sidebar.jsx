import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Sidebar({ items }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-surface border border-border rounded-md shadow-sm"
        aria-label="Buka menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={close}
        />
      )}
      <aside
        className={`w-60 bg-[#17243A] h-screen fixed left-0 top-0 z-40 flex flex-col transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold text-white">NCS Analyzer</h1>
          <p className="text-xs text-white/60 mt-0.5">Penilaian Keamanan</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {items.map((group, i) => (
            <div key={i} className="mb-6">
              {group.label && (
                <p className="text-xs font-semibold text-white/40 mb-2 px-3">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={close}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-r-md transition-colors ${
                        active
                          ? 'bg-[#2563EB] text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
