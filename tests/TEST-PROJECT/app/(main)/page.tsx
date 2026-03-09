"use client";

import { useCounterStore } from "@/stores/counter.store";
import { usePostStore } from "@/stores/post.store";
import { useEffect } from "react";

function Page() {
  const posts = usePostStore((state) => state.posts);
  const fetchPosts = usePostStore((state) => state.fetchPosts);
  const loading = usePostStore((state) => state.loading);

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading)
    return (
      <div>
        <p>Data Yükleniyor</p>
        <p>Lütfen Bekleyin...</p>
      </div>
    );

  return (
    <div>
      {posts.slice(0, 10).map((post, key) => (
        <>
          <h1 key={post.id}>{post.title}</h1>
          <p>{post.body}</p>
        </>
      ))}
    </div>
  );
}

export default Page;
