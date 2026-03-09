import { create } from "zustand";
import { UserDto } from "@/core/users/user.dto";
import { getUsers } from "@/services/user.service";

interface UserState {
  users: UserDto[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true });
    const data = await getUsers();
    set({ users: data, loading: false });
  },
}));
