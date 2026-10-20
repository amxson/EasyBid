import { beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PasswordRecovery from "../pages/PasswordRecovery";
vi.mock("axios", () => ({ default: { post: vi.fn(), put: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
const page = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password/:token" element={<PasswordRecovery />} />
      </Routes>
    </MemoryRouter>,
  );
it("submits an email and renders the neutral recovery response", async () => {
  axios.post.mockResolvedValue({
    data: {
      success: true,
      message:
        "If that address has an account, a reset link will arrive shortly.",
    },
  });
  page("/forgot-password");
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("reset link"),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(axios.post).toHaveBeenCalledWith("/api/v1/user/password/forgot", {
    email: "person@example.com",
  });
});
it("rejects mismatched passwords before making a request", async () => {
  page("/reset-password/test-token");
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "Password123!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "Different123!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByRole("alert").textContent).toContain("do not match");
  expect(axios.put).not.toHaveBeenCalled();
});
it("keeps expired-link errors visible and the form usable", async () => {
  axios.put.mockRejectedValue({
    response: { data: { message: "Reset link is invalid or expired." } },
  });
  page("/reset-password/expired-token");
  for (const label of ["New password", "Confirm password"])
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "Password123!" },
    });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("expired"),
  );
  expect(screen.getByRole("button", { name: "Update password" }).disabled).toBe(
    false,
  );
});
