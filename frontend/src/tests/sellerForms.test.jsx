import { it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import CardTwo from "../custom-components/CardTwo";

it("opens the existing republish calendar with the production date-picker module", () => {
  const store = configureStore({
    reducer: () => ({ auction: { loading: false } }),
  });
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter>
        <CardTwo
          title="Unsold item"
          id="listing"
          startTime="2025-01-01T00:00:00Z"
          endTime="2025-01-02T00:00:00Z"
          startingBid={100}
        />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Republish Auction" }));
  const dates = container.querySelectorAll(
    ".react-datepicker__input-container input",
  );
  expect(dates.length).toBe(2);
  fireEvent.click(dates[0]);
  expect(container.querySelector(".react-datepicker")).toBeTruthy();
});
