import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const RequireAuth = ({ children }) => {
    const { isAuthenticated } = useAuth();

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
