import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const RequireAuth = ({ children }) => {
    const { isAuthenticated, isBootstrapping } = useAuth();

    // this is so that RequireAuth doesn't immediately redirect before user gets bootstrapped from token
    if (isBootstrapping) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ infoMessage: "Please log in to continue." }}
            />
        );
    }

    return children;
};

export default RequireAuth;
