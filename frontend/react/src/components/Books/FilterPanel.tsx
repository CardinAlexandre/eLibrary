import React, { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Paper } from '@mui/material';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');

  const handleApply = () => {
    onFilterChange({ genre, language });
  };

  const handleReset = () => {
    setGenre('');
    setLanguage('');
    onFilterChange({ genre: '', language: '' });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Genre</InputLabel>
          <Select value={genre} label="Genre" onChange={(e) => setGenre(e.target.value)}>
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="Fiction">Fiction</MenuItem>
            <MenuItem value="Technology">Technology</MenuItem>
            <MenuItem value="Science Fiction">Science Fiction</MenuItem>
            <MenuItem value="Fantasy">Fantasy</MenuItem>
            <MenuItem value="History">History</MenuItem>
            <MenuItem value="Biography">Biography</MenuItem>
            <MenuItem value="Self-Help">Self-Help</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Langue</InputLabel>
          <Select value={language} label="Langue" onChange={(e) => setLanguage(e.target.value)}>
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleApply}>
          Appliquer
        </Button>
        <Button variant="outlined" onClick={handleReset}>
          Réinitialiser
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterPanel;

