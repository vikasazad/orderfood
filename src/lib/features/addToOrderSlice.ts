import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  addToOrderData: [] as any[], // Change this to an array of objects with 'name', 'price', and 'count'
  addedItemIds: [] as any[],
  finalOrder: {} as any,
};

export const addToOrder = createSlice({
  name: "addToCart",
  initialState,
  reducers: {
    addData: (state, action) => {
      console.log(action.payload);
      state.addToOrderData.push({
        item: action.payload.data,
        selectedType: action.payload.selectedType,
        count: 1,
        cartbutton: true,
      });
      state.addedItemIds.push(action.payload.data.id);
    },
    increment: (state, action) => {
      const { id } = action.payload;
      const item = state.addToOrderData.find(
        (item: any) => item.item.id === id
      );
      if (item) {
        item.count += 1;
      }
    },
    decrement: (state, action) => {
      const { id } = action.payload;
      const item = state.addToOrderData.find((item: any, k) => k === id);
      if (item && item.count > 0) {
        item.count -= 1;
      }
    },
    clearCart: (state) => {
      state.addToOrderData = [];
      state.addedItemIds = [];
    },
    clearSpecific: (state, action) => {
      state.addToOrderData = state.addToOrderData.filter(
        (item, id) => id !== action.payload
      );
      state.addedItemIds = state.addedItemIds.filter(
        (item, id) => id !== action.payload
      );
    },
    setFinalOrder: (state, action) => {
      state.finalOrder = action.payload;
    },
  },
});

export const {
  addData,
  increment,
  decrement,
  clearCart,
  clearSpecific,
  setFinalOrder,
} = addToOrder.actions;
export default addToOrder.reducer;
