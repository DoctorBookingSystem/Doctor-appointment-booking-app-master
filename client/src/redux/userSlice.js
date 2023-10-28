import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.isDoctor = false;
    },
    setIsDoctor: (state, action) => {
      state.isDoctor = action.payload;
    }
  },
});

export const { setUser, clearUser, setIsDoctor } = userSlice.actions;

export default userSlice.reducer;
