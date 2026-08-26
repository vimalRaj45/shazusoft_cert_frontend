import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import {
  Layers,
  UserCheck,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  Search,
  Menu,
  BarChart3
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Templates', path: '/admin/templates', icon: Layers },
    { label: 'Single Issue', path: '/admin/issue-single', icon: UserCheck },
    { label: 'Bulk CSV Issue', path: '/admin/issue-bulk', icon: FileSpreadsheet },
    { label: 'Certificates', path: '/admin/certificates', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    confirmDialog({
      message: 'Are you sure you want to sign out of your administrator account?',
      header: 'Sign Out Confirmation',
      icon: 'pi pi-sign-out',
      acceptClassName: 'p-button-danger font-bold',
      acceptLabel: 'Yes, Sign Out',
      rejectLabel: 'Stay Signed In',
      accept: () => {
        logout();
        navigate('/login');
      }
    });
  };

  return (
    <header
      className="sticky top-0 z-5 shadow-1"
      style={{
        background: '#FFFFFF',
        borderBottom: '1.5px solid #D3DDD7',
        height: '58px'
      }}
    >
      <div className="flex align-items-center justify-content-between px-2 sm:px-4 h-full flex-nowrap" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Left: Mobile Toggle & Official Brand Logo */}
        <div className="flex align-items-center gap-2 flex-nowrap flex-shrink-0">
          {isAuthenticated && (
            <button
              type="button"
              className="action-btn action-btn-secondary xl:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
              style={{ width: '32px', height: '32px', minWidth: '32px' }}
            >
              <Menu size={16} />
            </button>
          )}

          <Link to={isAuthenticated ? '/admin' : '/'} className="flex align-items-center gap-2 no-underline flex-nowrap">
            <img
              src="/logo.png"
              alt="Shazu Soft Technologies"
              style={{ maxHeight: '32px', width: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="flex flex-column justify-content-center">
              <span className="font-bold brand-font text-base sm:text-lg" style={{ color: '#123B32', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                CertiVerify
              </span>
              <span className="text-xs font-semibold hidden md:block" style={{ color: '#527A68', fontSize: '10.5px' }}>
                Shazu Soft Technologies
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Tabs (Clean minimal tabs with no pill bg and comfortable gaps) */}
        {isAuthenticated && (
          <nav className="hidden xl:flex align-items-center gap-4 flex-nowrap flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex align-items-center gap-2 py-2 font-bold transition-all whitespace-nowrap no-underline text-xs"
                  style={{
                    background: 'transparent',
                    color: active ? '#123B32' : '#527A68',
                    borderBottom: active ? '2px solid #123B32' : '2px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderRadius: 0,
                    padding: '6px 2px'
                  }}
                >
                  <Icon size={16} style={{ color: active ? '#123B32' : '#527A68' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Controls (Strictly single line, never stacks) */}
        <div className="flex align-items-center gap-1.5 sm:gap-2 flex-nowrap flex-shrink-0">
          <Link to="/lookup" className="no-underline hidden sm:inline-flex">
            <Button
              label="Recipient Portal"
              icon={<Search size={13} className="mr-1" />}
              className="p-button-outlined p-button-sm p-button-secondary font-bold text-xs py-1.5 px-2.5"
            />
          </Link>

          {isAuthenticated ? (
            <div className="flex align-items-center gap-2 pl-2 flex-nowrap" style={{ borderLeft: '1px solid #D3DDD7' }}>
              <div className="hidden 2xl:flex flex-column text-right leading-none">
                <span className="text-xs font-bold" style={{ color: '#123B32' }}>{user?.name || 'Administrator'}</span>
                <span className="text-500" style={{ fontSize: '10px' }}>{user?.email}</span>
              </div>
              <button
                type="button"
                className="action-btn action-btn-danger"
                title="Sign Out"
                style={{ width: '30px', height: '30px', minWidth: '30px' }}
                onClick={handleLogout}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="no-underline">
              <Button
                label="Admin Login"
                icon="pi pi-sign-in"
                className="p-button-primary p-button-sm font-bold text-xs py-1.5 px-3"
              />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <Sidebar
        visible={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        className="w-18rem sm:w-20rem"
        showCloseIcon={false}
      >
        <div className="flex flex-column h-full justify-content-between">
          <div>
            {/* Custom Aligned Header */}
            <div className="flex align-items-center justify-content-between pb-3 mb-3" style={{ borderBottom: '1.5px solid #D3DDD7' }}>
              <div className="flex align-items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Shazu Soft Technologies"
                  style={{ maxHeight: '34px', width: 'auto' }}
                />
                <div>
                  <div className="font-bold text-base brand-font" style={{ color: '#123B32' }}>CertiVerify</div>
                  <div className="text-xs font-medium" style={{ color: '#527A68', fontSize: '11px' }}>{user?.email || 'Admin Portal'}</div>
                </div>
              </div>

              <button
                type="button"
                className="action-btn action-btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '50%' }}
              >
                <span className="pi pi-times text-xs" />
              </button>
            </div>

            {/* Navigation List - Clean & No Pill Backgrounds */}
            <div className="flex flex-column gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex align-items-center gap-3 px-3 py-2.5 font-bold transition-all no-underline text-sm"
                    style={{
                      background: 'transparent',
                      color: active ? '#123B32' : '#527A68',
                      borderLeft: active ? '3px solid #123B32' : '3px solid transparent',
                      paddingLeft: '12px'
                    }}
                  >
                    <Icon size={18} style={{ color: active ? '#123B32' : '#527A68' }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="my-2" style={{ borderTop: '1px solid #D3DDD7' }} />

              <Link
                to="/lookup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex align-items-center gap-3 px-3 py-2.5 font-bold no-underline text-sm"
                style={{ color: '#527A68', borderLeft: '3px solid transparent', paddingLeft: '12px' }}
              >
                <Search size={18} style={{ color: '#527A68' }} />
                <span>Recipient Portal</span>
              </Link>
            </div>
          </div>

          {/* Bottom Sign Out Area */}
          <div className="pt-3 pb-2" style={{ borderTop: '1.5px solid #D3DDD7' }}>
            <Button
              label="Sign Out"
              icon={<LogOut size={15} className="mr-2" />}
              className="p-button-outlined p-button-danger w-full font-bold py-2 text-xs"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            />
          </div>
        </div>
      </Sidebar>

      {/* Confirmation Modal Component */}
      <ConfirmDialog />
    </header>
  );
}
