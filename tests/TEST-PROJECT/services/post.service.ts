import { PostDto } from "@/core/post/post.dto";

export async function getPosts(): Promise<PostDto[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");

  if (!res.ok) {
    throw new Error("Veri alma işleminde hata gerçekleşti");
  }

  return res.json();
}
