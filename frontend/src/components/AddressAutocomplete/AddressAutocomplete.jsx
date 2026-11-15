import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X, Check, Search } from 'lucide-react';
import { getApiUrl } from '../../config/api';
import './AddressAutocomplete.css';

/**
 * AddressAutocomplete component powered by Locio API
 * Provides live G-NAF Australian address suggestions with unit/level detection,
 * keyboard navigation, and full address metadata callback.
 */
export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelectAddress,
  placeholder = 'Start typing Australian address (e.g. 120 Collins St)...',
  id,
  name,
  required = false,
  disabled = false,
  className = '',
  inputStyle = {},
  theme = 'auto' // 'auto', 'dark', 'light'
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Synchronize internal state with incoming value
  useEffect(() => {
    if (value !== inputValue && !isOpen) {
      setInputValue(value || '');
    }
  }, [value]);

  // Click outside listener to dismiss suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch address suggestions from backend proxy or directly from Locio
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      // 1. Try Backend Proxy
      let data = null;
      try {
        const proxyRes = await fetch(
          getApiUrl(`/api/addresses/autocomplete?q=${encodeURIComponent(query.trim())}`),
          { signal: abortControllerRef.current.signal }
        );
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch (proxyErr) {
        if (proxyErr.name === 'AbortError') return;
        // Fallback to direct Locio API if proxy fails
      }

      // 2. Direct Locio fallback if proxy didn't return data
      if (!data || !Array.isArray(data.data)) {
        const apiKey = import.meta.env.VITE_LOCIO_API_KEY || 'lc_live_mcekcmhbkxsw43fwnurez74vndu5nadenhscywhfbhlus7e53vja';
        const directRes = await fetch(
          `https://api.locio.com.au/v1/addresses?q=${encodeURIComponent(query.trim())}&country=AU`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
            },
            signal: abortControllerRef.current.signal
          }
        );
        if (directRes.ok) {
          data = await directRes.json();
        }
      }

      const results = (data && Array.isArray(data.data)) ? data.data : [];
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Address autocomplete error:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle user input with 250ms debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setJustSelected(false);
    if (onChange) onChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  // Select an address from suggestions
  const handleSelect = (item) => {
    const formatted = item.formatted || item.address || '';
    setInputValue(formatted);
    setIsOpen(false);
    setSuggestions([]);
    setJustSelected(true);

    if (onChange) onChange(formatted);
    if (onSelectAddress) onSelectAddress(item);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`locio-autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <div className="locio-input-container">
        <MapPin size={16} className="locio-pin-icon" />
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !justSelected) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="locio-input"
          style={inputStyle}
        />

        <div className="locio-input-adornment">
          {loading && (
            <Loader2 size={15} className="locio-spinner" />
          )}
          {!loading && inputValue && !disabled && (
            <button
              type="button"
              className="locio-clear-btn"
              onClick={handleClear}
              title="Clear address"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="locio-dropdown-menu" role="listbox">
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            const components = item.components || {};
            const locality = components.locality_name || item.locality || '';
            const state = components.state || '';
            const postcode = components.postcode || '';

            return (
              <li
                key={item.id || item.gnaf_pid || index}
                role="option"
                aria-selected={isHighlighted}
                className={`locio-suggestion-item ${isHighlighted ? 'highlighted' : ''}`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(item)}
              >
                <div className="locio-item-icon-box">
                  <MapPin size={15} />
                </div>
                <div className="locio-item-content">
                  <div className="locio-item-formatted">{item.formatted}</div>
                  {(locality || state || postcode) && (
                    <div className="locio-item-sub">
                      <span className="locio-suburb-tag">{locality}</span>
                      <span className="locio-region-text">{state} {postcode}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          <li className="locio-dropdown-footer">
            <span>Powered by <strong>Locio</strong> &bull; Official G-NAF Australian Addresses</span>
          </li>
        </ul>
      )}
    </div>
  );
}
