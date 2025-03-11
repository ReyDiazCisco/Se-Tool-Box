// src/App.jsx
import React, { useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FilterPage from "./pages/FilterPage";
import TemplatePage from "./pages/TemplatePage";

function App() {
  // State to manage light/dark mode
  const [mode, setMode] = useState("light");

  // Toggle function
  const handleToggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Create theme using MUI's createTheme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
              // Light mode custom palette
              primary: {
                main: "#001f3f", // a navy color
              },
              background: {
                default: "#f5f5f5", // off-white
                paper: "#ffffff",
              },
            }
            : {
              // Dark mode custom palette
              primary: {
                main: "#001f3f", // a navy color
              },
              background: {
                default: "#0d1117", // typical dark background
                paper: "#161b22",
              },
            }),
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Layout wraps the drawer/header around your routes */}
      <Layout onToggleTheme={handleToggleTheme} currentMode={mode}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/template" element={<TemplatePage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
