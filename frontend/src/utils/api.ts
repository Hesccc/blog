const API_BASE_URL = 'http://localhost:5000';

export interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  access_count: number;
  thumbnail: string | null;
  status: number;
  create_time: string;
  update_time: string;
  meta_description: string | null;
  categories: { id: number; name: string; slug: string; color: string }[];
  tags: { id: number; name: string; slug: string; color: string }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  parent_id: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface SystemEnv {
  os: string;
  run_env: string;
  python_v: string;
  flask_v: string;
  blog_v: string;
  datetime: string;
  db_type: string;
  SQLAlchemy_v: string;
  node_v: string;
  cpu_usage: number;
  mem_usage: number;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('blog_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_username');
    if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.msg || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Authentication
  login: async (username: string, password: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('blog_token', data.token);
    localStorage.setItem('blog_username', data.username);
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_username');
  },

  getCurrentUser: () => {
    return apiFetch('/api/auth/me');
  },

  // Public Posts, Categories, Tags & Config
  getPosts: (params: { page?: number; per_page?: number; category?: string; tag?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());
    if (params.category) query.set('category', params.category);
    if (params.tag) query.set('tag', params.tag);
    if (params.search) query.set('search', params.search);
    
    return apiFetch(`/api/posts?${query.toString()}`);
  },

  getPost: (id: number): Promise<Post> => {
    return apiFetch(`/api/posts/${id}`);
  },

  getCategories: (): Promise<Category[]> => {
    return apiFetch('/api/categories');
  },

  getTags: (): Promise<Tag[]> => {
    return apiFetch('/api/tags');
  },

  getConfig: (): Promise<Record<string, string>> => {
    return apiFetch('/api/config');
  },

  // Admin Manage APIs
  adminGetPosts: (params: { page?: number; per_page?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());
    if (params.search) query.set('search', params.search);
    
    return apiFetch(`/api/manage/posts?${query.toString()}`);
  },

  adminGetPost: (id: number): Promise<Post> => {
    return apiFetch(`/api/manage/posts/${id}`);
  },

  adminCreatePost: (post: { title: string; content: string; status: number; category_id?: number; tag_ids: number[] }): Promise<Post> => {
    return apiFetch('/api/manage/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  adminUpdatePost: (id: number, post: { title?: string; content?: string; status?: number; category_id?: number | null; tag_ids?: number[] }): Promise<Post> => {
    return apiFetch(`/api/manage/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  },

  adminDeletePost: (id: number) => {
    return apiFetch(`/api/manage/posts/${id}`, {
      method: 'DELETE',
    });
  },

  adminGetEnv: (): Promise<SystemEnv> => {
    return apiFetch('/api/manage/env');
  },

  // Admin Categories & Tags
  adminCreateCategory: (cat: { name: string; slug: string; description?: string; color?: string }) => {
    return apiFetch('/api/manage/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  },

  adminUpdateCategory: (id: number, cat: { name?: string; slug?: string; description?: string; color?: string }) => {
    return apiFetch(`/api/manage/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cat),
    });
  },

  adminDeleteCategory: (id: number) => {
    return apiFetch(`/api/manage/categories/${id}`, {
      method: 'DELETE',
    });
  },

  adminCreateTag: (tag: { name: string; slug: string; color?: string }) => {
    return apiFetch('/api/manage/tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    });
  },

  adminUpdateTag: (id: number, tag: { name?: string; slug?: string; color?: string }) => {
    return apiFetch(`/api/manage/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tag),
    });
  },

  adminDeleteTag: (id: number) => {
    return apiFetch(`/api/manage/tags/${id}`, {
      method: 'DELETE',
    });
  },

  adminUpdateConfig: (config: Record<string, string>): Promise<Record<string, string>> => {
    return apiFetch('/api/manage/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
};
