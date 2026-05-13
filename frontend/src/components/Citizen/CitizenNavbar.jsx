import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import "../../styles/Citizen/CitizenNavbar.css";

export default function CitizenNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (path === "/report") return pathname.startsWith("/report");
    return pathname === path;
  };

  return (
    <nav className="cn-nav">
      <div className="cn-nav-brand" onClick={() => navigate("/dashboard")}>
        <img src={logoImage} alt="CRIMSON logo" className="cn-nav-logo-icon" />
        <span className="cn-nav-logo-text">CRIMSON</span>
      </div>
      <ul className="cn-nav-links">
        <li
          className={isActive("/dashboard") ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          Home
        </li>
        <li
          className={isActive("/report") ? "active" : ""}
          onClick={() => navigate("/report")}
        >
          Report
        </li>
        <li
          className={isActive("/heatmap") ? "active" : ""}
          onClick={() => navigate("/heatmap")}
        >
          Heatmap
        </li>
        <li
          className={isActive("/support") ? "active" : ""}
          onClick={() => navigate("/support")}
        >
          Support
        </li>
      </ul>
      <div className="cn-nav-avatar">
        <div
          className="cn-avatar-circle"
          onClick={() => navigate("/myprofile")}
          title="My Profile"
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || "C"}
        </div>
      </div>
    </nav>
  );
}
