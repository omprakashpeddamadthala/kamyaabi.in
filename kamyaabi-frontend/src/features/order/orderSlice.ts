import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderApi } from '../../api/orderApi';
import { Order, PaymentMethod } from '../../types';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  pageSize: 10,
  loading: false,
  error: null,
};

export const createOrder = createAsyncThunk(
  'orders/create',
  async (
    {
      shippingAddressId,
      couponCode,
      paymentMethod,
    }: {
      shippingAddressId: number;
      couponCode?: string;
      paymentMethod?: PaymentMethod;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await orderApi.create(shippingAddressId, couponCode, paymentMethod);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to create order');
    }
  },
);

export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async ({ page, size }: { page?: number; size?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await orderApi.getAll(page, size);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await orderApi.getById(id);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch order');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    /**
     * Patch the selectedOrder in place after a background status refresh.
     * This avoids triggering a full loading spinner — the UI updates silently.
     */
    patchSelectedOrder(state, action: { payload: Order }) {
      state.selectedOrder = action.payload;
      // Also update the order in the list view if it's present
      const idx = state.orders.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) state.orders[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ── fetchOrderById ─────────────────────────────────────────────────────
      // Clear stale selectedOrder immediately so the old order's status cannot
      // appear while the new one is loading (fixes the /orders/1016 stale bug).
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedOrder = null;  // ← key fix: clear stale data
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { patchSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
