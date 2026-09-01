import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";
import { useAuthContext } from "@/stores/authContext";

export function AppLayout() {
  const auth = useAuthContext();
  const location = useLocation();

  const handleLock = async () => {
    await auth.lock();
  };

  const handleLogout = async () => {
    await auth.logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0b0b] text-[#f5f5f5]">
      <Sidebar />
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden">
        <Header
          username={auth.status?.admin_username ?? null}
          onLock={handleLock}
          onLogout={handleLogout}
        />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div key={location.pathname} className="mx-auto w-full max-w-[1600px] p-5 lg:p-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
