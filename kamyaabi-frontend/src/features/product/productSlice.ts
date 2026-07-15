import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import { Product, Category } from '../../types';

export interface ProductLoadError {
  message: string;
  status?: number;
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  selectedProductLoading: boolean;
  selectedProductError: ProductLoadError | null;
  selectedProductRequestKey: string | null;
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  categories: [],
  selectedProduct: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 6,
  loading: false,
  error: null,
  selectedProductLoading: false,
  selectedProductError: null,
  selectedProductRequestKey: null,
};

type ProductSort = import('../../api/productApi').ProductSort;
type ProductThunkConfig = { rejectValue: ProductLoadError };

const toProductLoadError = (error: unknown): ProductLoadError => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return {
      message: error.response?.data?.message || error.message || 'Failed to fetch product',
      status: error.response?.status,
    };
  }
  return { message: 'Failed to fetch product' };
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (
    { page, size, sort }: { page?: number; size?: number; sort?: ProductSort } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await productApi.getAll({ page, size, sort });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async (
    {
      categoryId,
      page,
      size,
      sort,
    }: { categoryId: number; page?: number; size?: number; sort?: ProductSort },
    { rejectWithValue },
  ) => {
    try {
      const response = await productApi.getByCategory(categoryId, { page, size, sort });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/search',
  async (
    {
      keyword,
      page,
      size,
      sort,
    }: { keyword: string; page?: number; size?: number; sort?: ProductSort },
    { rejectWithValue },
  ) => {
    try {
      const response = await productApi.search(keyword, { page, size, sort });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to search products');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productApi.getFeatured();
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch featured products');
    }
  }
);

export const fetchProductById = createAsyncThunk<Product, number, ProductThunkConfig>(
  'products/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await productApi.getById(id);
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(toProductLoadError(error));
    }
  }
);

export const fetchProductBySlug = createAsyncThunk<Product, string, ProductThunkConfig>(
  'products/fetchBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await productApi.getBySlug(slug);
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(toProductLoadError(error));
    }
  }
);

export const fetchProductsByTag = createAsyncThunk(
  'products/fetchByTag',
  async (
    {
      tagSlug,
      page,
      size,
      sort,
    }: { tagSlug: string; page?: number; size?: number; sort?: ProductSort },
    { rejectWithValue },
  ) => {
    try {
      const response = await productApi.getByTag(tagSlug, { page, size, sort });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products by tag');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryApi.getAll();
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    hydrateSelectedProduct: (state, action: { payload: Product }) => {
      state.selectedProduct = action.payload;
      state.selectedProductLoading = false;
      state.selectedProductError = null;
      state.selectedProductRequestKey = `slug:${action.payload.slug}`;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
      state.selectedProductLoading = false;
      state.selectedProductError = null;
      state.selectedProductRequestKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductsByCategory.pending, (state) => { state.loading = true; })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      .addCase(fetchProductById.pending, (state, action) => {
        state.selectedProductLoading = true;
        state.selectedProductError = null;
        state.selectedProductRequestKey = `id:${action.meta.arg}`;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selectedProductLoading = false;
        state.selectedProductError = null;
        state.selectedProductRequestKey = `id:${action.meta.arg}`;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.selectedProductLoading = false;
        state.selectedProductError = action.payload || { message: action.error.message || 'Failed to fetch product' };
        state.selectedProductRequestKey = `id:${action.meta.arg}`;
      })
      .addCase(fetchProductBySlug.pending, (state, action) => {
        state.selectedProductLoading = true;
        state.selectedProductError = null;
        state.selectedProductRequestKey = `slug:${action.meta.arg}`;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.selectedProductLoading = false;
        state.selectedProductError = null;
        state.selectedProductRequestKey = `slug:${action.meta.arg}`;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.selectedProductLoading = false;
        state.selectedProductError = action.payload || { message: action.error.message || 'Failed to fetch product' };
        state.selectedProductRequestKey = `slug:${action.meta.arg}`;
      })
      .addCase(fetchProductsByTag.pending, (state) => { state.loading = true; })
      .addCase(fetchProductsByTag.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchProductsByTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearSelectedProduct, hydrateSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
