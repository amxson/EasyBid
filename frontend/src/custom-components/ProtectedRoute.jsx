import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Spinner from "./Spinner";
export default function ProtectedRoute({ children, role }) {
  const { authenticationChecked, isAuthenticated, user } = useSelector(
    (state) => state.user,
  );
  if (!authenticationChecked) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.string,
};
