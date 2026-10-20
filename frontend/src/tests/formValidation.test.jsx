import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import user, { fetchUser, fetchLeaderboard, register } from "../store/slices/userSlice";
import auction from "../store/slices/auctionSlice";
import commission from "../store/slices/commissionSlice";
import SignUp from "../pages/SignUp";
import CreateAuction from "../pages/CreateAuction";
import SubmitCommission from "../pages/SubmitCommission";
import Login from "../pages/Login";
import { auctionError } from "../lib/forms";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const userData = { _id: "test-bidder", role: "Bidder", userName: "Test Person" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ close: vi.fn() }));
  URL.createObjectURL = vi.fn(() => "blob:test-photo");
  URL.revokeObjectURL = vi.fn();
  axios.get.mockResolvedValue({ data: { leaderboard: [] } });
});
afterEach(() => vi.unstubAllGlobals());

function show(Component = SignUp, seller = false) {
  const store = configureStore({ reducer: { user, auction, commission } });
  if (seller) store.dispatch({ type: 'user/loginSuccess', payload: { user: { role: 'Auctioneer' } } });
  const view = render(<Provider store={store}><MemoryRouter><Component /></MemoryRouter></Provider>);
  return { store, form: view.container.querySelector('form') };
}
async function fillSignup() {
  for (const [name, value] of [['Full Name', 'Test Person'], ['Email', 'test@example.com'], ['Phone', '+12025550123'], ['Address', 'Test address'], ['Password', 'Password123!']])
    fireEvent.change(screen.getByLabelText(name, { exact: true }), { target: { value } });
  fireEvent.change(screen.getByLabelText('Role', { exact: true }), { target: { value: 'Bidder' } });
  fireEvent.change(screen.getByLabelText('Profile Image'), { target: { files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Register', exact: true }).disabled).toBe(false));
}

it('requires personal details and an image before registration', () => {
  const { form } = show();
  fireEvent.submit(form);
  expect(screen.getByRole('alert').textContent).toMatch(/complete all personal details/i);
  expect(axios.post).not.toHaveBeenCalled();
  for (const label of ['Full Name', 'Email', 'Phone', 'Address', 'Role', 'Password', 'Profile Image'])
    expect(screen.getByLabelText(label, { exact: true }).required).toBe(true);
  expect(screen.getByLabelText('Bank name').disabled).toBe(true);
});
it('rejects video immediately and clears the selection without reading it', () => {
  show();
  const input = screen.getByLabelText('Profile Image');
  fireEvent.change(input, { target: { files: [new File(['video'], 'movie.mp4', { type: 'video/mp4' })] } });
  expect(screen.getByRole('alert').textContent).toMatch(/videos are not supported/i);
  expect(createImageBitmap).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
  expect(input.value).toBe('');
});
it('rejects oversized and unreadable images before submission', async () => {
  show();
  const input = screen.getByLabelText('Profile Image');
  fireEvent.change(input, { target: { files: [new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })] } });
  expect(screen.getByRole('alert').textContent).toMatch(/4 MB/);
  createImageBitmap.mockRejectedValueOnce(new Error('Invalid data'));
  fireEvent.change(input, { target: { files: [new File(['video'], 'fake.jpg', { type: 'image/jpeg' })] } });
  await screen.findByText(/not a readable image/i);
  expect(screen.getByRole('button', { name: 'Register', exact: true }).disabled).toBe(false);
});
it('does not reuse an earlier valid photo after an invalid selection', async () => {
  const { form } = show();
  await fillSignup();
  fireEvent.change(screen.getByLabelText('Profile Image'), { target: { files: [new File(['video'], 'bad.mp4', { type: 'video/mp4' })] } });
  fireEvent.submit(form);
  expect(axios.post).not.toHaveBeenCalled();
  expect(screen.getAllByRole('alert').some(x => /choose an image/i.test(x.textContent))).toBe(true);
});
it('requires receiving details only for an Auctioneer', async () => {
  const { form } = show();
  await fillSignup();
  fireEvent.change(screen.getByLabelText('Role', { exact: true }), { target: { value: 'Auctioneer' } });
  fireEvent.submit(form);
  expect(screen.getByRole('alert').textContent).toMatch(/auctioneers must add/i);
  expect(axios.post).not.toHaveBeenCalled();
});
it('prevents repeat submits during upload and recovers from timeout without clearing fields', async () => {
  let reject;
  axios.post.mockReturnValue(new Promise((resolve, fail) => { reject = fail; }));
  const { form, store } = show();
  await fillSignup();
  fireEvent.submit(form);
  await store.dispatch(fetchLeaderboard());
  fireEvent.submit(form);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Registering...' }).disabled).toBe(true);
  expect(axios.post.mock.calls[0][2].timeout).toBe(45000);
  reject({ code: 'ECONNABORTED' });
  await screen.findByText(/request timed out/i);
  expect(screen.getByRole('button', { name: 'Register', exact: true }).disabled).toBe(false);
  expect(screen.getByLabelText('Full Name').value).toBe('Test Person');
});
it('shows server validation errors beside registration and allows retry', async () => {
  axios.post.mockRejectedValue({ response: { status: 409, data: { message: 'User already registered.' } } });
  const { form } = show();
  await fillSignup();
  fireEvent.submit(form);
  await screen.findByText('User already registered.');
  expect(screen.getByRole('button', { name: 'Register', exact: true }).disabled).toBe(false);
});
it('ignores a stale session check that finishes after successful registration', async () => {
  let reject;
  axios.get.mockReturnValueOnce(new Promise((resolve, fail) => { reject = fail; }));
  axios.post.mockResolvedValue({ data: { success: true, user: userData, message: 'Registered.' } });
  const store = configureStore({ reducer: { user } });
  const pending = store.dispatch(fetchUser());
  await store.dispatch(register(new FormData()));
  reject({ response: { status: 401 } });
  await pending;
  expect(store.getState().user.isAuthenticated).toBe(true);
});
it.each([[CreateAuction, 'Auction item image'], [SubmitCommission, 'Payment Proof (ScreenShot)']])('rejects videos in the other image forms', (Component, label) => {
  const { form } = show(Component, true);
  fireEvent.change(screen.getByLabelText(label), { target: { files: [new File(['video'], 'clip.mp4', { type: 'video/mp4' })] } });
  expect(screen.getByRole('alert').textContent).toMatch(/videos are not supported/i);
  fireEvent.submit(form);
  expect(axios.post).not.toHaveBeenCalled();
});
it('validates auction dates and positive prices before sending a request', () => {
  const values = { title: 'Item', description: 'Description', category: 'Electronics', condition: 'Used', startingBid: '-1', startTime: new Date(Date.now() + 60000), endTime: new Date(Date.now() + 120000) };
  expect(auctionError(values, {})).toMatch(/positive amount/i);
  expect(auctionError({ ...values, startingBid: '10', endTime: values.startTime }, {})).toMatch(/end time after/i);
});
it('shows login failures inline and releases its button', async () => {
  axios.post.mockRejectedValue({ response: { status: 401, data: { message: 'Invalid credentials.' } } });
  const { form } = show(Login);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
  fireEvent.submit(form);
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toBe('Invalid credentials.');
  expect(screen.getByRole('button', { name: 'Login', exact: true }).disabled).toBe(false);
});
