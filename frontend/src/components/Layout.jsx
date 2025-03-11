// src/components/Layout.jsx
import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    CssBaseline,
    Drawer,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Switch,
    styled,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import FilterListIcon from "@mui/icons-material/FilterList";
import DescriptionIcon from "@mui/icons-material/Description";
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 220;

const Main = styled("main")(({ theme }) => ({
    flexGrow: 1,
    // Removed marginLeft so the content goes behind the drawer
    marginLeft: 0,
    // You can also remove or adjust padding if you want the hero
    // to start at the very top-left corner:
    padding: 0,
}));

function Layout({ children, onToggleTheme, currentMode }) {
    const [open, setOpen] = useState(true);
    const location = useLocation();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const activeRoute = location.pathname;

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            {/* AppBar */}
            <AppBar position="fixed" sx={{ ml: open ? `${drawerWidth}px` : "0px" }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {activeRoute === "/" && "Home"}
                        {activeRoute === "/filter" && "Filter"}
                        {activeRoute === "/template" && "Template"}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Typography variant="body1" sx={{ mr: 1 }}>
                        {currentMode === "light" ? "Light Mode" : "Dark Mode"}
                    </Typography>
                    <Switch
                        checked={currentMode === "dark"}
                        onChange={onToggleTheme}
                        color="default"
                    />
                </Toolbar>
            </AppBar>

            {/* Persistent Drawer */}
            <Drawer
                variant="persistent"
                anchor="left"
                open={open}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                    },
                }}
            >
                <Toolbar />
                <Divider />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton component={Link} to="/" selected={activeRoute === "/"}>
                            <ListItemIcon>
                                <HomeIcon />
                            </ListItemIcon>
                            <ListItemText primary="Home" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            component={Link}
                            to="/filter"
                            selected={activeRoute === "/filter"}
                        >
                            <ListItemIcon>
                                <FilterListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Filter" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            component={Link}
                            to="/template"
                            selected={activeRoute === "/template"}
                        >
                            <ListItemIcon>
                                <DescriptionIcon />
                            </ListItemIcon>
                            <ListItemText primary="Template" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>

            {/* Main content area now spans full width behind the drawer */}
            <Main>
                <Toolbar />
                {children}
            </Main>
        </Box>
    );
}

export default Layout;
