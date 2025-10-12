import React, { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Paper, Typography, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
  initialGenre?: string;
  initialLanguage?: string;
  initialOrderBy?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  onFilterChange,
  initialGenre = '',
  initialLanguage = '',
  initialOrderBy = 'relevance'
}) => {
  const [genre, setGenre] = useState(initialGenre);
  const [language, setLanguage] = useState(initialLanguage);
  const [orderBy, setOrderBy] = useState(initialOrderBy);

  const handleGenreChange = (value: string) => {
    setGenre(value);
    onFilterChange({ genre: value, language, orderBy });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    onFilterChange({ genre, language: value, orderBy });
  };

  const handleOrderByChange = (value: string) => {
    setOrderBy(value);
    onFilterChange({ genre, language, orderBy: value });
  };

  const handleReset = () => {
    setGenre('');
    setLanguage('');
    setOrderBy('relevance');
    onFilterChange({ genre: '', language: '', orderBy: 'relevance' });
  };

  const hasActiveFilters = genre || language || orderBy !== 'relevance';

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="action" />
          <Typography variant="body2" color="text.secondary">
            Filtres
          </Typography>
          {hasActiveFilters && (
            <Chip 
              label={`${[genre, language].filter(Boolean).length} actif(s)`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Genre</InputLabel>
          <Select 
            value={genre} 
            label="Genre" 
            onChange={(e) => handleGenreChange(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="Fiction">Fiction</MenuItem>
            <MenuItem value="Technology">Technology</MenuItem>
            <MenuItem value="Science Fiction">Science Fiction</MenuItem>
            <MenuItem value="Fantasy">Fantasy</MenuItem>
            <MenuItem value="History">History</MenuItem>
            <MenuItem value="Biography">Biography</MenuItem>
            <MenuItem value="Self-Help">Self-Help</MenuItem>
            <MenuItem value="Business">Business</MenuItem>
            <MenuItem value="Philosophy">Philosophy</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Langue</InputLabel>
          <Select 
            value={language} 
            label="Langue" 
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="it">Italiano</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Trier par</InputLabel>
          <Select 
            value={orderBy} 
            label="Trier par" 
            onChange={(e) => handleOrderByChange(e.target.value)}
          >
            <MenuItem value="relevance">Pertinence</MenuItem>
            <MenuItem value="newest">Plus récent</MenuItem>
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default FilterPanel;

