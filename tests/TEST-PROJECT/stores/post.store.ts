import { create } from "zustand";
import { PostDto } from "@/core/post/post.dto";
import { getPosts } from "@/services/post.service";

interface PostState {
  posts: PostDto[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  loading: false,

  fetchPosts: async () => {
    set({ loading: true });
    const data = await getPosts();
    set({ posts: data, loading: false });
  },
}));
