// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Container,
    useTheme
} from "@mui/material";
import { Link } from "react-router-dom";

function HomePage() {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";

    const [message, setMessage] = useState("");

    // Fetch greeting from the backend root ("/") endpoint
    useEffect(() => {
        fetch("http://127.0.0.1:8000/")
            .then((response) => response.json())
            .then((data) => setMessage(data.Hello)) // data.Hello must match the dict key in main.py
            .catch((error) => console.error(error));
    }, []);

    // Example feature cards
    const features = [
        {
            title: "Hierarchical Filter",
            description:
                "Include/exclude data across multiple columns to refine your final list quickly.",
            cta: "Try The Filter",
            link: "/filter"
        },
        {
            title: "Script Integrations",
            description:
                "Soon we'll add more Python scripts to parse Excel, run analytics, and more.",
            cta: "Stay Tuned",
            link: "/template"
        },
        {
            title: "More Tools on the Way",
            description:
                "We keep expanding the SE Tool Box with new utilities to streamline your workflow.",
            cta: "Learn More",
            link: "/template"
        }
    ];

    // Define a hero gradient using your theme's palette
    const heroGradient = isDarkMode
        ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.background.default} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.background.default} 100%)`;

    // Styles for the "primary" contained buttons on the feature cards
    const containedButtonStyle = {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
        transition: "all 0.3s ease",
        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: 2
        }
    };

    // NEW: White contained button for the "Get Started" link
    const whiteButtonStyle = {
        backgroundColor: "#fff",
        color: theme.palette.primary.main,
        fontWeight: 600,
        transition: "all 0.3s ease",
        "&:hover": {
            backgroundColor: "#f0f0f0" // or any slight gray
        }
    };

    return (
        <Box
            sx={{
                width: "100%",
                minHeight: "100vh",
                bgcolor: theme.palette.background.default,
                display: "flex",
                flexDirection: "column"
            }}
        >
            {/* --- HERO BANNER (Full-Width) --- */}
            <Box
                sx={{
                    width: "100%",
                    // Increase the hero banner's vertical space
                    minHeight: { xs: "40vh", md: "25vh" },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    px: 2,
                    py: 4,
                    textAlign: "center",
                    background: heroGradient,
                    color: "#ffffff"
                }}
            >
                <Typography variant="h2" sx={{ mb: 2, fontWeight: 600 }}>
                    Welcome to the SE Tool Box
                </Typography>
                <Typography
                    variant="h6"
                    sx={{ maxWidth: "600px", mx: "auto", opacity: 0.9 }}
                >
                    A one-stop solution for Solutions Engineers to streamline data filtering,
                    run powerful scripts, and boost productivity.
                </Typography>
            </Box>

            {/* --- MAIN CONTENT BELOW THE HERO --- */}
            <Container sx={{ py: 6 }}>
                {/* Greeting Section */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                        Server Greeting: {message || "Loading..."}
                    </Typography>
                </Box>

                {/* Features Section */}
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 500 }}>
                    Explore Our Features
                </Typography>
                <Grid container spacing={4}>
                    {features.map((feat) => (
                        <Grid item xs={12} sm={6} md={4} key={feat.title}>
                            <Card
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    boxShadow: 3,
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: 6
                                    }
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                        {feat.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {feat.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ p: 2 }}>
                                    <Button
                                        variant="contained"
                                        component={Link}
                                        to={feat.link}
                                        sx={containedButtonStyle}
                                    >
                                        {feat.cta}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Info about the filter */}
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                        About Our Hierarchical Filter
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        This filter feature lets you include or exclude multiple columns
                        (like Business Entity, Product Type, or SAV Name) all in one pass.
                        Perfect for narrowing down large Excel data sets to exactly the
                        rows you need. When you exclude something, it gets removed from
                        your final list, ensuring a clean, targeted output every time!
                    </Typography>
                    {/* Change this button to a white contained style */}
                    <Button
                        variant="contained"
                        component={Link}
                        to="/filter"
                        sx={whiteButtonStyle}
                    >
                        Get Started With The Filter
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}

export default HomePage;
