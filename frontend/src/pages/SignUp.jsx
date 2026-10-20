import { register } from "@/store/slices/userSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { IMAGE_ACCEPT, IMAGE_HELP, registrationError } from "@/lib/forms";

const SignUp = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [TelebirrAccountNumber, setTelebirrAccountNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const photo = useImageUpload();
  const form = useFormSubmission();

  const { isAuthenticated } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = (e) => {
    e.preventDefault();
    if (form.submitting || photo.checking) return;
    const values = { userName, email, phone, password, address, role, bankAccountName, bankAccountNumber, bankName, TelebirrAccountNumber, paypalEmail };
    const problem = registrationError(values, photo.file);
    if (problem) { form.setError(problem); return; }
    const formData = new FormData();
    for (const key of ["userName", "email", "phone", "password", "address", "role"])
      formData.append(key, key === "password" ? values[key] : values[key].trim());
    formData.append("profileImage", photo.file);
    if (role === "Auctioneer")
      for (const key of ["bankAccountName", "bankAccountNumber", "bankName", "TelebirrAccountNumber", "paypalEmail"])
        formData.append(key, values[key].trim());
    form.submit(() => dispatch(register(formData)));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo("/");
    }
  }, [navigateTo, isAuthenticated]);

  return (
    <>
      <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-center">
        <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
          <h1
            className={`text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
          >
            Register
          </h1>
          <form
            className="flex flex-col gap-5 w-full"
            onSubmit={handleRegister}
            onInvalid={() => form.setError("Complete the required fields with valid information.")}
            aria-busy={form.submitting}
          >
            <p className="font-semibold text-xl md:text-2xl">
              Personal Details
            </p>
            <p className="text-sm text-stone-600">All personal details and a profile image are required. Payment details are required only for Auctioneers.</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-name" className="text-[16px] text-stone-600">Full Name</label>
                <input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  required minLength={3} maxLength={40}
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                />
              </div>
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-email" className="text-[16px] text-stone-600">Email</label>
                <input
                  id="signup-email"
                  name="email"
                  autoComplete="email"
                  required maxLength={254}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-phone" className="text-[16px] text-stone-600">Phone</label>
                <input
                  id="signup-phone"
                  name="phone"
                  autoComplete="tel"
                  required pattern="\+?[0-9]{9,15}" maxLength={16}
                  title="9 to 15 digits, optionally starting with +"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                />
              </div>
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-address" className="text-[16px] text-stone-600">Address</label>
                <input
                  id="signup-address"
                  name="address"
                  autoComplete="street-address"
                  required maxLength={300}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-role" className="text-[16px] text-stone-600">Role</label>
                <select
                  id="signup-role"
                  name="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                >
                  <option value="">Select Role</option>
                  <option value="Auctioneer">Auctioneer</option>
                  <option value="Bidder">Bidder</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-1">
                <label htmlFor="signup-password" className="text-[16px] text-stone-600">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  autoComplete="new-password"
                  required minLength={8} maxLength={72}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-1 gap-2">
              <label htmlFor="signup-photo" className="text-[16px] text-stone-600">
                Profile Image
              </label>
              <div className="flex items-center gap-3">
                <img
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith("/imageHolder.jpg"))
                      event.currentTarget.src = "/imageHolder.jpg";
                  }}
                  src={
                    photo.preview
                      ? photo.preview
                      : "/imageHolder.jpg"
                  }
                  alt="profileImagePreview"
                  className="w-14 h-14 rounded-full"
                />
                <input id="signup-photo" name="profileImage" type="file" accept={IMAGE_ACCEPT} required onChange={photo.onChange} aria-describedby="signup-photo-help" className="min-w-0 w-full" />
              </div>
              <p id="signup-photo-help" className="text-sm text-stone-600">{IMAGE_HELP}</p>
              {photo.error && <p role="alert" className="text-[#b8381e]">{photo.error}</p>}
            </div>
            <div className="flex flex-col gap-4">
              <label className="font-semibold text-xl md:2xl flex flex-col">
                Payment Method Details{" "}
                <span className="text-[12px] text-stone-500">
                  Fill Payment Details (add at least one method) Only If you are
                  registering as an Auctioneer
                </span>
              </label>
              <div className="flex flex-col gap-2">
                <label className="text-[16px] text-stone-500">
                  Bank Details
                </label>
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                  <select
                    aria-label="Bank name" autoComplete="off"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden sm:flex-1"
                    disabled={role !== "Auctioneer"}
                  >
                    <option value="">Select Your Bank</option>
                    <option value="CBE">CBE</option>
                    <option value="Awash">Awash</option>
                    <option value="Dashen">Dashen</option>
                    <option value="Abisiniya">Abisiniya</option>
                  </select>
                  <input
                    aria-label="Bank account number" autoComplete="off" maxLength={100}
                    type="text"
                    value={bankAccountNumber}
                    placeholder="ACC NO"
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden sm:flex-1"
                    disabled={role !== "Auctioneer"}
                  />
                  <input
                    aria-label="Bank account name" autoComplete="off" maxLength={100}
                    type="text"
                    value={bankAccountName}
                    placeholder="Bank Account UserName"
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden sm:flex-1"
                    disabled={role !== "Auctioneer"}
                  />
                </div>
              </div>
              <div>
                <label className="text-[16px] text-stone-600 font-semibold">
                  TeleBirr And Paypal
                </label>
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                  <input
                    aria-label="Telebirr phone number" autoComplete="off" pattern="\+?[0-9]{9,15}" maxLength={16}
                    type="tel"
                    value={TelebirrAccountNumber}
                    placeholder="phone Number"
                    onChange={(e) => setTelebirrAccountNumber(e.target.value)}
                    className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden sm:flex-1"
                    disabled={role !== "Auctioneer"}
                  />
                  <input
                    aria-label="PayPal email" autoComplete="off" maxLength={100}
                    type="email"
                    value={paypalEmail}
                    placeholder="Paypal Email"
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden sm:flex-1"
                    disabled={role !== "Auctioneer"}
                  />
                </div>
              </div>
            </div>

            {form.error && <p role="alert" className="text-[#b8381e]">{form.error}</p>}
            <button
              className="bg-[#d6482b] w-full max-w-[640px] font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-2 px-4 rounded-md text-white mx-auto my-4 disabled:opacity-60"
              type="submit"
              disabled={form.submitting || photo.checking}
            >
              {photo.checking ? "Checking image..." : form.submitting ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default SignUp;
