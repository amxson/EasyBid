import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../custom-components/ProtectedRoute";
function page(user) {
  const store = configureStore({ reducer: () => ({ user }) });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute role="Auctioneer">
                <p>Seller page</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
it("waits for session hydration before deciding whether to redirect", () => {
  page({ authenticationChecked: false, isAuthenticated: false, user: {} });
  expect(screen.queryByText("Login page")).toBeNull();
  expect(screen.queryByText("Seller page")).toBeNull();
});
it("redirects guests to login", () => {
  page({ authenticationChecked: true, isAuthenticated: false, user: {} });
  expect(screen.getByText("Login page")).toBeTruthy();
});
it("allows the correct role", () => {
  page({
    authenticationChecked: true,
    isAuthenticated: true,
    user: { role: "Auctioneer" },
  });
  expect(screen.getByText("Seller page")).toBeTruthy();
});
