import axiosInstance from './axiosInstance';
import {
  ApiResponse,
  BlogPost,
  BlogCategory,
  BlogTag,
  PageResponse,
} from '../types';

export interface BlogPostRequest {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  status?: string;
  scheduledAt?: string;
  categoryIds?: number[];
  tagIds?: number[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  isFeatured?: boolean;
  authorId?: number;
}

export interface BlogCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
}

export interface BlogTagRequest {
  name: string;
  slug?: string;
  description?: string;
}

// ── Public Blog API ─────────────────────────────────────────

export const blogApi = {
  getPosts: (params: {
    page?: number;
    size?: number;
    category?: string;
    tag?: string;
    search?: string;
    featured?: boolean;
  } = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<BlogPost>>>('/api/blog/posts', { params }),

  getPostBySlug: (slug: string) =>
    axiosInstance.get<ApiResponse<BlogPost>>(`/api/blog/posts/${slug}`),

  incrementViewCount: (id: number) =>
    axiosInstance.post<ApiResponse<void>>(`/api/blog/posts/${id}/view`),

  getRelatedPosts: (id: number, limit = 3) =>
    axiosInstance.get<ApiResponse<BlogPost[]>>(`/api/blog/posts/${id}/related`, {
      params: { limit },
    }),

  getCategories: () =>
    axiosInstance.get<ApiResponse<BlogCategory[]>>('/api/blog/categories'),

  getCategoryBySlug: (slug: string) =>
    axiosInstance.get<ApiResponse<BlogCategory>>(`/api/blog/categories/${slug}`),

  getTags: () =>
    axiosInstance.get<ApiResponse<BlogTag[]>>('/api/blog/tags'),

  getTagBySlug: (slug: string) =>
    axiosInstance.get<ApiResponse<BlogTag>>(`/api/blog/tags/${slug}`),
};

// ── Admin Blog API ──────────────────────────────────────────

export const adminBlogApi = {
  getPosts: (params: { page?: number; size?: number; status?: string; q?: string } = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<BlogPost>>>('/api/admin/blog/posts', { params }),

  getPostById: (id: number) =>
    axiosInstance.get<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}`),

  createPost: (data: BlogPostRequest) =>
    axiosInstance.post<ApiResponse<BlogPost>>('/api/admin/blog/posts', data),

  updatePost: (id: number, data: BlogPostRequest) =>
    axiosInstance.put<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}`, data),

  deletePost: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/blog/posts/${id}`),

  publishPost: (id: number) =>
    axiosInstance.post<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}/publish`),

  unpublishPost: (id: number) =>
    axiosInstance.post<ApiResponse<BlogPost>>(`/api/admin/blog/posts/${id}/unpublish`),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<ApiResponse<{ url: string; publicId: string }>>(
      '/api/admin/blog/media/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  getCategories: () =>
    axiosInstance.get<ApiResponse<BlogCategory[]>>('/api/admin/blog/categories'),

  createCategory: (data: BlogCategoryRequest) =>
    axiosInstance.post<ApiResponse<BlogCategory>>('/api/admin/blog/categories', data),

  updateCategory: (id: number, data: BlogCategoryRequest) =>
    axiosInstance.put<ApiResponse<BlogCategory>>(`/api/admin/blog/categories/${id}`, data),

  deleteCategory: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/blog/categories/${id}`),

  getTags: () =>
    axiosInstance.get<ApiResponse<BlogTag[]>>('/api/admin/blog/tags'),

  createTag: (data: BlogTagRequest) =>
    axiosInstance.post<ApiResponse<BlogTag>>('/api/admin/blog/tags', data),

  updateTag: (id: number, data: BlogTagRequest) =>
    axiosInstance.put<ApiResponse<BlogTag>>(`/api/admin/blog/tags/${id}`, data),

  deleteTag: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/blog/tags/${id}`),
};
