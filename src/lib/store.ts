import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import searchReducer from "./features/searchSlice";
import addToOrderReducer from "./features/addToOrderSlice";
import activeFooterItemReducer from "./features/activeFooterCategory";
import authReducer from "./features/authSlice";

// Persist configuration for auth slice
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "isAuthenticated", "user"], // Only persist these fields
};

// Combine all reducers
const rootReducer = combineReducers({
  searchTerm: searchReducer,
  addToOrderData: addToOrderReducer,
  activeFooterItem: activeFooterItemReducer,
  auth: persistReducer(authPersistConfig, authReducer),
});

const store = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
};

export type AppStore = ReturnType<typeof store>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export default store;
// const store = () => {
//   return configureStore({
//     reducer: {
//       searchTerm: searchReducer,
//       addToOrderData: addToOrderReducer,
//       activeFooterItem: activeFooterItemReducer,
//       // firebaseManagementData: firebaseManagementDataReducer,
//       //     // firestoreMultipleData: firestoreMultipleDataReducer,
//       //     // firebaseData: firebaseDataReducer,
//       //     // listData: listReducer,
//       //     // activeFooterItem: activeFooterItemReducer,
//       //     // botToOrderData: botToOrderReducer,
//       //     // botChat: botChatReducer,
//       //     // afterOrderData: afterOrderReducer,
//       //     // adminRestaurantInfo: adminRestaurantInfoReducer,
//     },
