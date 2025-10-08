import { createReducer, on } from '@ngrx/store';
import { toggleDarkMode } from '../actions/theme.actions';

export interface ThemeState {
  darkMode: boolean;
}

const initialState: ThemeState = {
  darkMode: localStorage.getItem('darkMode') === 'true'
};

export const themeReducer = createReducer(
  initialState,
  on(toggleDarkMode, (state) => {
    const newDarkMode = !state.darkMode;
    localStorage.setItem('darkMode', newDarkMode.toString());
    return { ...state, darkMode: newDarkMode };
  })
);

