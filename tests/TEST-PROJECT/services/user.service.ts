import { UserDto } from "@/core/users/user.dto";

export async function getUsers(): Promise<UserDto[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");

  if (!res.ok) {
    throw new Error("Verileri çekemedim!");
  }

  return res.json();
}
