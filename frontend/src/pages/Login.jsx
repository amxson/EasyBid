import { login } from "@/store/slices/userSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, isAuthenticated } = useSelector((state) => state.user);

  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo("/");
    }
  }, [isAuthenticated, navigateTo]);

  return (
    <>
      <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-center">
        <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md sm:w-[600px] sm:h-[450px]">
          <h1
            className={`text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
          >
            Login
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email"
                className="text-[16px] text-stone-500"
              >
                Email
              </label>
              <input
                id="login-email"
                autoComplete="email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-password"
                className="text-[16px] text-stone-500"
              >
                Password
              </label>
              <input
                id="login-password"
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
            </div>
            <button
              className="bg-[#d6482b] font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-2 px-4 rounded-md text-white mx-auto my-4"
              disabled={loading}
              type="submit"
            >
              {loading ? "Logging In..." : "Login"}
            </button>
            <Link
              to="/forgot-password"
              className="text-sm text-[#d6482b] underline underline-offset-4 text-center"
            >
              Forgot password?
            </Link>
          </form>
        </div>
      </section>
    </>
  );
};

export default Login;
