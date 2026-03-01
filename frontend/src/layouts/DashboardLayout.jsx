import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  return (
    <Box
      sx={{ minHeight: "100vh", display: "flex", backgroundColor: "#f4f6f8" }}>
      <Sidebar />

      <Box
        sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <Box
          component="main"
          sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
