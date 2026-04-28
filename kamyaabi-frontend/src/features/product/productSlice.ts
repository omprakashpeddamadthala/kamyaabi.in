import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import { Product, Category } from '../../types';

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
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  categories: [],
  selectedProduct: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 12,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async ({ page, size, sortBy, sortDir }: { page?: number; size?: number; sortBy?: string; sortDir?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await productApi.getAll(page, size, sortBy, sortDir);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async ({ categoryId, page, size }: { categoryId: number; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await productApi.getByCategory(categoryId, page, size);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/search',
  async ({ keyword, page, size }: { keyword: string; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await productApi.search(keyword, page, size);
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

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await productApi.getById(id);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch product');
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
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
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
      .addCase(fetchProductById.pending, (state) => { state.loading = true; })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
