import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  OutlinedInput,
  IconButton,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';  // adjust path as needed
import ApiClient from '../ApiClient';

function PipelineIdentifierPage() {
  const [sessionId, setSessionId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [uniqueColumnValues, setUniqueColumnValues] = useState({}); // State to store unique values for dropdowns

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.uploadFile(file, "/pipeline-identifier/upload");
      setSessionId(response.session_id);
      const cols = await ApiClient.getColumns(response.session_id);
      setColumns(cols.columns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriterion = () => {
    setCriteriaList((prev) => [
      ...prev,
      { id: uuidv4(), columnName: columns[0] || '', filter: {} },
    ]);
  };

  const handleCriterionChange = (id, field, value) => {
    setCriteriaList((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [field]: value, filter: field === 'columnName' ? {} : c.filter }
          : c
      )
    );
  };

  // Fetch unique values for string columns when columnName changes
  useEffect(() => {
    criteriaList.forEach(async (criterion) => {
      const type = getColumnType(criterion.columnName);
      if (sessionId && criterion.columnName && type === 'string') {
        if (!uniqueColumnValues[criterion.id]) { // Fetch only if values haven't been fetched for this criterion
          try {
            const values = await ApiClient.getUniqueColumnValues(sessionId, criterion.columnName);
            setUniqueColumnValues(prev => ({
              ...prev,
              [criterion.id]: values.values || []
            }));
          } catch (err) {
            console.error(`Error fetching unique values for ${criterion.columnName}:`, err);
          }
        }
      }
    });
  }, [criteriaList, sessionId, uniqueColumnValues]); // Add uniqueColumnValues to dependencies

  const handleFilterChange = (id, filterField, value) => {
    setCriteriaList((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, filter: { ...c.filter, [filterField]: value } }
          : c
      )
    );
  };

  const handleRemoveCriterion = (id) => {
    setCriteriaList((prev) => prev.filter((c) => c.id !== id));
  };

  const getColumnType = (name) => {
    if (!name) return 'string';
    const key = name.toLowerCase();
    if (key.includes('date')) return 'date';
    if (['price', 'quantity', 'value'].some((k) => key.includes(k))) return 'number';
    return 'string';
  };

  const transformCriteriaForBackend = (list) => {
    const result = {};
    list.forEach(({ columnName, filter }) => {
      if (!columnName) return;
      const type = getColumnType(columnName);
      if (type === 'string' && filter.value) { // Only include if filter value exists
        result[columnName] = {
          values: filter.value
            ? filter.value.split(',').map((v) => v.trim())
            : [],
        };
      } else if (type === 'number') {
        result[columnName] = {
          min: filter.min !== '' ? parseFloat(filter.min) : null,
          max: filter.max !== '' ? parseFloat(filter.max) : null,
        };
      } else if (type === 'date') {
        result[columnName] = {
          start_date: filter.start_date
            ? dayjs(filter.start_date).format('YYYY-MM-DD')
            : null,
          end_date: filter.end_date
            ? dayjs(filter.end_date).format('YYYY-MM-DD')
            : null,
        };
      }
    });
    return result;
  };

  const handleIdentifyOpportunities = async () => {
    if (!sessionId || !criteriaList.length) {
      setError('Please upload a file and define at least one criterion.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const criteria = transformCriteriaForBackend(criteriaList);
      const res = await ApiClient.identifyOpportunities(sessionId, criteria);
      setOpportunities(res.opportunities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportOpportunities = async () => {
    if (!sessionId || !criteriaList.length) {
      setError('Please upload a file and define at least one criterion for export.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const criteria = transformCriteriaForBackend(criteriaList);
      const blob = await ApiClient.exportOpportunities(sessionId, criteria);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'PotentialOpportunities.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Pipeline Identifier
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Ready Report
        </Typography>
        <FileUpload onFileUpload={handleFileUpload} />
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}
        {sessionId && (
          <Typography sx={{ mt: 2 }}>Session ID: {sessionId}</Typography>
        )}
      </Paper>

      {sessionId && (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Define Identification Criteria
            </Typography>

            {criteriaList.map((criterion) => {
              const type = getColumnType(criterion.columnName);
              return (
                <Paper key={criterion.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 180, mt: 1 }}>
                      <InputLabel>Column</InputLabel>
                      <Select
                        value={criterion.columnName}
                        onChange={(e) => handleCriterionChange(criterion.id, 'columnName', e.target.value)}
                        label="Column"
                      >
                        {columns.map((col) => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {type === 'string' && (
                      <FormControl size="small" sx={{ flexGrow: 1, mt: 1 }}>
                      <InputLabel id={`filter-value-label-${criterion.id}`}>Filter Value(s)</InputLabel>
                      <Select
                        labelId={`filter-value-label-${criterion.id}`}
                        multiple
                        size="small"
                        label="Filter Value(s) (comma-separated)"
                        value={criterion.filter.value || []}
                        onChange={(e) => handleFilterChange(criterion.id, 'value', e.target.value)}
                        input={<OutlinedInput id={`select-multiple-chip-${criterion.id}`} label="Filter Value(s)" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                        // Add MenuProps if needed for styling/positioning the dropdown
                      >
                        {(uniqueColumnValues[criterion.id] || []).map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                     </FormControl>
                    )}
                    {type === 'number' && (
                      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                        <TextField
                          size="small"
                          label="Min Value"
                          type="number"
                          value={criterion.filter.min || ''}
                          onChange={(e) => handleFilterChange(criterion.id, 'min', e.target.value)}
                          sx={{ width: '50%' }}
                        />
                        <TextField
                          size="small"
                          label="Max Value"
                          type="number"
                          value={criterion.filter.max || ''}
                          onChange={(e) => handleFilterChange(criterion.id, 'max', e.target.value)}
                          sx={{ width: '50%' }}
                        />
                      </Box>
                    )}

                    {type === 'date' && (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                          <DatePicker
                            size="small"
                            label="Start Date"
                            value={
                              criterion.filter.start_date ? dayjs(criterion.filter.start_date) : null
                            }
                            onChange={(newVal) => handleFilterChange(criterion.id, 'start_date', newVal)}
                            sx={{ width: '50%' }}
                          />
                          <DatePicker
                            size="small"
                            label="End Date"
                            value={
                              criterion.filter.end_date ? dayjs(criterion.filter.end_date) : null
                            }
                            onChange={(newVal) => handleFilterChange(criterion.id, 'end_date', newVal)}
                            sx={{ width: '50%' }}
                          />
                        </Box>
                      </LocalizationProvider>
                    )}

                    <IconButton
                      onClick={() => handleRemoveCriterion(criterion.id)}
                      aria-label="delete"
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })}

            <Button variant="outlined" onClick={handleAddCriterion} sx={{ mr: 2 }}>
              Add Criterion
            </Button>
            <Button variant="contained" onClick={handleIdentifyOpportunities}>
              Identify Opportunities
            </Button>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Potential Opportunities
            </Typography>
            {opportunities.length > 0 ? (
              <Typography>Displaying {opportunities.length} opportunities.</Typography>
            ) : (
              <Typography>
                No opportunities found yet. Define criteria and click "Identify Opportunities".
              </Typography>
            )}
            {opportunities.length > 0 && (
              <Button variant="contained" onClick={handleExportOpportunities} sx={{ mt: 2 }}>
                Export Opportunities
              </Button>
            )}
          </Paper>
        </>
      )}

      {!sessionId && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Define Identification Criteria
          </Typography>
          <Typography>Upload a Ready Report file to define criteria.</Typography>
        </Paper>
      )}
    </Container>
  );
}

export default PipelineIdentifierPage;
