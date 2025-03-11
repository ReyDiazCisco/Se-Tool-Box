// frontend/src/pages/FilterPage.jsx
import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    OutlinedInput,
    Chip,
    CircularProgress,
    Backdrop,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    Container,
    Paper,
    Stack
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// EXACT column names that match your DataFrame in "Powered by Cisco Ready"
const columns = [
    "Business Entity",
    "Sub Business Entity",
    "Asset Type",
    "Product Type",
    "Product Family",
    "Product ID",
];

function FilterPage() {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";

    const [sessionId, setSessionId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // === SET A ===
    const [setASelected, setSetASelected] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {})
    );
    const [setAUnique, setSetAUnique] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {})
    );

    // === SET B ===
    const [setBSelected, setSetBSelected] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {})
    );
    const [setBUnique, setSetBUnique] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {})
    );

    // logic type
    const [logicType, setLogicType] = useState("difference");

    // final result
    const [savNames, setSavNames] = useState([]);

    // loading spinner
    const [loading, setLoading] = useState(false);

    // 1) file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch("http://127.0.0.1:8000/filters/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                throw new Error(`Upload failed. Status: ${res.status}`);
            }
            const data = await res.json();
            setSessionId(data.session_id);

            // Reset everything
            const blank = columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
            setSetASelected(blank);
            setSetBSelected(blank);
            setSavNames([]);

            const blankUniques = columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
            setSetAUnique(blankUniques);
            setSetBUnique(blankUniques);

            // fetch initial column's unique values
            const firstCol = columns[0];
            const initA = await fetchUniqueValues(data.session_id, firstCol, {});
            const initB = await fetchUniqueValues(data.session_id, firstCol, {});
            setSetAUnique((prev) => ({ ...prev, [firstCol]: initA }));
            setSetBUnique((prev) => ({ ...prev, [firstCol]: initB }));

            alert("File uploaded & session started!");
        } catch (err) {
            console.error(err);
            alert("Error uploading file: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2) fetch unique values
    const fetchUniqueValues = async (session_id, column, filters) => {
        const body = { session_id, column, filters };
        const res = await fetch("http://127.0.0.1:8000/filters/uniqueValues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            let errMsg = `Failed to fetch unique values for ${column}`;
            try {
                const errJson = await res.json();
                errMsg += `: ${JSON.stringify(errJson)}`;
            } catch (e) {
                // ignore parse error
            }
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.values;
    };

    // 3) handle Set A changes
    const handleSetAChange = async (col, newVals) => {
        if (!sessionId) {
            alert("No session. Please upload a file first.");
            return;
        }
        try {
            setLoading(true);
            const updated = { ...setASelected, [col]: newVals };

            // Reset subsequent columns
            const idx = columns.indexOf(col);
            for (let i = idx + 1; i < columns.length; i++) {
                updated[columns[i]] = [];
                setSetAUnique((prev) => ({ ...prev, [columns[i]]: [] }));
            }
            setSetASelected(updated);

            // fetch next column's values
            const nextIdx = idx + 1;
            if (nextIdx < columns.length) {
                const nextCol = columns[nextIdx];
                const fetched = await fetchUniqueValues(sessionId, nextCol, updated);
                setSetAUnique((prev) => ({ ...prev, [nextCol]: fetched }));
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching next column for Set A: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 4) handle Set B changes
    const handleSetBChange = async (col, newVals) => {
        if (!sessionId) {
            alert("No session. Please upload a file first.");
            return;
        }
        try {
            setLoading(true);
            const updated = { ...setBSelected, [col]: newVals };

            // Reset subsequent columns
            const idx = columns.indexOf(col);
            for (let i = idx + 1; i < columns.length; i++) {
                updated[columns[i]] = [];
                setSetBUnique((prev) => ({ ...prev, [columns[i]]: [] }));
            }
            setSetBSelected(updated);

            // fetch next column's values
            const nextIdx = idx + 1;
            if (nextIdx < columns.length) {
                const nextCol = columns[nextIdx];
                const fetched = await fetchUniqueValues(sessionId, nextCol, updated);
                setSetBUnique((prev) => ({ ...prev, [nextCol]: fetched }));
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching next column for Set B: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 5) select/deselect all in a column
    const handleToggleAll = (col, whichSet) => {
        if (whichSet === "A") {
            const allVals = setAUnique[col] || [];
            const currSelected = setASelected[col] || [];
            const isAllSelected = currSelected.length === allVals.length;
            const newVals = isAllSelected ? [] : allVals;
            handleSetAChange(col, newVals);
        } else {
            const allVals = setBUnique[col] || [];
            const currSelected = setBSelected[col] || [];
            const isAllSelected = currSelected.length === allVals.length;
            const newVals = isAllSelected ? [] : allVals;
            handleSetBChange(col, newVals);
        }
    };

    const getToggleButtonLabel = (col, whichSet) => {
        let allVals = [];
        let currSelected = [];
        if (whichSet === "A") {
            allVals = setAUnique[col] || [];
            currSelected = setASelected[col] || [];
        } else {
            allVals = setBUnique[col] || [];
            currSelected = setBSelected[col] || [];
        }
        if (!allVals.length) return "Select All";
        return currSelected.length === allVals.length ? "Deselect All" : "Select All";
    };

    // 6) apply filters
    const handleApplyFilters = async () => {
        if (!sessionId) {
            alert("No session. Please upload a file first.");
            return;
        }
        try {
            setLoading(true);
            const body = {
                session_id: sessionId,
                filtersA: setASelected,
                filtersB: setBSelected,
                logic_type: logicType,
            };
            const res = await fetch("http://127.0.0.1:8000/filters/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                throw new Error("Failed to finalize filters.");
            }
            const data = await res.json();
            setSavNames(data.savNames || []);
        } catch (err) {
            console.error(err);
            alert("Error finalizing filters: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 7) export
    const handleExport = async () => {
        if (!sessionId) {
            alert("No session. Please upload a file first.");
            return;
        }
        try {
            setLoading(true);
            const body = {
                session_id: sessionId,
                filtersA: setASelected,
                filtersB: setBSelected,
                logic_type: logicType,
            };
            const res = await fetch("http://127.0.0.1:8000/filters/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                throw new Error("Export failed.");
            }
            const arrayBuffer = await res.arrayBuffer();

            // If in Electron, show Save As & write file
            if (window.electronAPI) {
                const filePath = await window.electronAPI.showSaveDialog("FilteredResult.xlsx");
                if (!filePath) return;
                const result = await window.electronAPI.writeFile(filePath, arrayBuffer);
                if (!result.success) throw new Error(result.error);
                alert("Exported successfully!");
            } else {
                // fallback for a normal browser environment:
                const url = window.URL.createObjectURL(
                    new Blob([arrayBuffer], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    })
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "FilteredResult.xlsx";
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error(err);
            alert("Error exporting: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const buttonStyle = {
        minWidth: 120,
        height: 48,
        color: isDarkMode ? "#fff" : "inherit",
        flexShrink: 0
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Two-Set Filtering
            </Typography>

            {/* Upload Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <input type="file" onChange={handleFileChange} />
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        sx={{ ...(isDarkMode && { color: "#fff" }) }}
                    >
                        Upload & Start Session
                    </Button>
                </Stack>
            </Paper>

            {/* Logic Type */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="logic-type-label">Logic Type</InputLabel>
                    <Select
                        labelId="logic-type-label"
                        id="logic-type-select"
                        value={logicType}
                        label="Logic Type"
                        onChange={(e) => setLogicType(e.target.value)}
                    >
                        <MenuItem value="difference">Difference (A but not B)</MenuItem>
                        <MenuItem value="intersection">Intersection (A and B)</MenuItem>
                        <MenuItem value="only_a">Only A</MenuItem>
                        <MenuItem value="only_b">Only B</MenuItem>
                        <MenuItem value="union">Union (A or B)</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* Set A */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Set A</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ overflow: "visible" }}>
                        {columns.map((col) => {
                            const selectedVals = setASelected[col] || [];
                            const availableVals = setAUnique[col] || [];
                            const toggleLabel = getToggleButtonLabel(col, "A");

                            return (
                                <Box
                                    key={col}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        mb: 2,
                                        flexWrap: "nowrap",
                                        overflowX: "auto",
                                        overflowY: "visible",
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleToggleAll(col, "A")}
                                        sx={buttonStyle}
                                    >
                                        {toggleLabel}
                                    </Button>
                                    <FormControl sx={{ minWidth: 300 }}>
                                        <InputLabel>{col}</InputLabel>
                                        <Select
                                            multiple
                                            label={col}
                                            value={selectedVals}
                                            onChange={(e) => handleSetAChange(col, e.target.value)}
                                            input={<OutlinedInput label={col} />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip key={value} label={value} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {availableVals.map((val) => (
                                                <MenuItem key={val} value={val}>
                                                    {val}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            );
                        })}
                    </AccordionDetails>
                </Accordion>
            </Paper>

            {/* Set B */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Set B</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ overflow: "visible" }}>
                        {columns.map((col) => {
                            const selectedVals = setBSelected[col] || [];
                            const availableVals = setBUnique[col] || [];
                            const toggleLabel = getToggleButtonLabel(col, "B");

                            return (
                                <Box
                                    key={col}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        mb: 2,
                                        flexWrap: "nowrap",
                                        overflowX: "auto",
                                        overflowY: "visible",
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleToggleAll(col, "B")}
                                        sx={buttonStyle}
                                    >
                                        {toggleLabel}
                                    </Button>
                                    <FormControl sx={{ minWidth: 300 }}>
                                        <InputLabel>{col}</InputLabel>
                                        <Select
                                            multiple
                                            label={col}
                                            value={selectedVals}
                                            onChange={(e) => handleSetBChange(col, e.target.value)}
                                            input={<OutlinedInput label={col} />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip key={value} label={value} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {availableVals.map((val) => (
                                                <MenuItem key={val} value={val}>
                                                    {val}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            );
                        })}
                    </AccordionDetails>
                </Accordion>
            </Paper>

            {/* Apply & Export */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        onClick={handleApplyFilters}
                        sx={{ ...(isDarkMode && { color: "#fff" }) }}
                    >
                        Apply Filters
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleExport}
                        sx={{
                            ...(isDarkMode && { color: "#fff", borderColor: "#fff" }),
                        }}
                    >
                        Export to Excel
                    </Button>
                </Stack>
            </Paper>

            {/* Results */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Final SAV Names ({savNames.length})</Typography>
                {savNames.length === 0 ? (
                    <Typography>No results yet</Typography>
                ) : (
                    <ul>
                        {savNames.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                )}
            </Paper>

            {/* Spinner */}
            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 9999 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Container>
    );
}

export default FilterPage;
