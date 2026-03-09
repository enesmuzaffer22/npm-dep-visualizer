"use client";

import { useUserStore } from "@/stores/user.store";
import { useEffect } from "react";

function Page() {
  const users = useUserStore((state) => state.users);
  const loading = useUserStore((state) => state.loading);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <>
        <p>Veriler Yükleniyor</p>
      </>
    );
  }

  return (
    <>
      {users.slice(0, 4).map((user) => (
        <div key={user.id} className="flex flex-col gap-2 border p-2">
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>
      ))}
    </>
  );
}

export default Page;
