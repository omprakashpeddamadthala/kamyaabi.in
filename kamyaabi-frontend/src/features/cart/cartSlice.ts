import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartApi } from '../../api/cartApi';
import { Cart } from '../../types';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  updatingItemIds: number[];
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  updatingItemIds: [],
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await cartApi.get();
    return response.data.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity }: { productId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await cartApi.addItem(productId, quantity);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }: { itemId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await cartApi.updateQuantity(itemId, quantity);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId: number, { rejectWithValue }) => {
    try {
      const response = await cartApi.removeItem(itemId);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cart = null;
    },
    optimisticUpdateQuantity: (state, action: PayloadAction<{ itemId: number; quantity: number }>) => {
      if (state.cart) {
        const item = state.cart.items.find(i => i.id === action.payload.itemId);
        if (item) {
          const price = item.productDiscountPrice || item.productPrice;
          item.quantity = action.payload.quantity;
          item.subtotal = price * action.payload.quantity;
          state.cart.totalItems = state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
          state.cart.totalAmount = state.cart.items.reduce((sum, i) => sum + i.subtotal, 0);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addToCart.fulfilled, (state, action) => { state.cart = action.payload; })
      .addCase(updateCartItem.pending, (state, action) => {
        state.updatingItemIds = [...state.updatingItemIds, action.meta.arg.itemId];
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.updatingItemIds = state.updatingItemIds.filter(id => id !== action.meta.arg.itemId);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updatingItemIds = state.updatingItemIds.filter(id => id !== action.meta.arg.itemId);
        state.error = action.payload as string;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => { state.cart = action.payload; });
  },
});

export const { clearCart, optimisticUpdateQuantity } = cartSlice.actions;
export default cartSlice.reducer;
