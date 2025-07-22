// types/api.ts
// export interface APIResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }

export interface Post {
  postId: string;
  authorId: string;
  title: string;
  content: string;
  likes: string[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    userId: string;
    name: string;
    email: string;
  };
}
