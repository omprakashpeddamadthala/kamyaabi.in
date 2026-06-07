import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistApi } from '../../api/wishlistApi';
import { Wishlist } from '../../types';

interface WishlistState {
  wishlist: Wishlist | null;
  productIds: number[];
  loading: boolean;
  error: string | null;
  togglingProductIds: number[];
}

const initialState: WishlistState = {
  wishlist: null,
  productIds: [],
  loading: false,
  error: null,
  togglingProductIds: [],
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.get();
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist');
    }
  },
);

export const fetchWishlistProductIds = createAsyncThunk(
  'wishlist/fetchProductIds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.getProductIds();
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist product IDs');
    }
  },
);

export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggle',
  async ({ productId, isInWishlist }: { productId: number; isInWishlist: boolean }, { rejectWithValue }) => {
    try {
      if (isInWishlist) {
        await wishlistApi.removeItem(productId);
      } else {
        await wishlistApi.addItem(productId);
      }
      const response = await wishlistApi.getProductIds();
      return { productIds: response.data.data, productId, added: !isInWishlist };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to update wishlist');
    }
  },
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.removeItem(productId);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to remove from wishlist');
    }
  },
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.wishlist = null;
      state.productIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWishlistProductIds.fulfilled, (state, action) => {
        state.productIds = action.payload;
      })
      .addCase(toggleWishlistItem.pending, (state, action) => {
        state.togglingProductIds = [...state.togglingProductIds, action.meta.arg.productId];
      })
      .addCase(toggleWishlistItem.fulfilled, (state, action) => {
        state.productIds = action.payload.productIds;
        state.togglingProductIds = state.togglingProductIds.filter(
          (id) => id !== action.meta.arg.productId,
        );
      })
      .addCase(toggleWishlistItem.rejected, (state, action) => {
        state.togglingProductIds = state.togglingProductIds.filter(
          (id) => id !== action.meta.arg.productId,
        );
        state.error = action.payload as string;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload;
        state.productIds = action.payload.items.map((item) => item.productId);
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
