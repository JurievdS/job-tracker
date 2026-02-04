import { useState, useRef, useEffect } from 'react';

export interface ComboBoxOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Currently selected option */
  value: ComboBoxOption | null;
  /** Called when an option is selected */
  onChange: (option: ComboBoxOption | null) => void;
  /** Called when user types - use this to fetch/filter options */
  onSearch: (term: string) => void;
  /** Available options to display */
  options: ComboBoxOption[];
  /** Show loading indicator */
  loading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Allow creating new options */
  allowCreate?: boolean;
  /** Called when user wants to create a new option */
  onCreateNew?: (term: string) => void;
  /** Disable the input */
  disabled?: boolean;
}

/**
 * ComboBox - A searchable dropdown with async option loading
 *
 * Unlike a native <select>, this allows typing to filter/search options.
 * Use this for cases where you need to search a backend API as the user types.
 *
 * Usage:
 * ```tsx
 * const [company, setCompany] = useState<ComboBoxOption | null>(null);
 * const [companies, setCompanies] = useState<ComboBoxOption[]>([]);
 * const [loading, setLoading] = useState(false);
 *
 * const handleSearch = async (term: string) => {
 *   setLoading(true);
 *   const results = await companiesApi.search(term);
 *   setCompanies(results.map(c => ({ value: c.id.toString(), label: c.name })));
 *   setLoading(false);
 * };
 *
 * <ComboBox
 *   label="Company"
 *   value={company}
 *   onChange={setCompany}
 *   onSearch={handleSearch}
 *   options={companies}
 *   loading={loading}
 *   placeholder="Search companies..."
 *   allowCreate
 *   onCreateNew={(name) => createCompany(name)}
 * />
 * ```
 */
export function ComboBox({
  label,
  error,
  value,
  onChange,
  onSearch,
  options,
  loading = false,
  placeholder = 'Search...',
  allowCreate = false,
  onCreateNew,
  disabled = false,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value?.label || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  // Sync input value when external value changes
  useEffect(() => {
    setInputValue(value?.label || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected value if user didn't pick anything
        if (value) {
          setInputValue(value.label);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onSearch(newValue);
  };

  const handleSelect = (option: ComboBoxOption) => {
    onChange(option);
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = () => {
    if (onCreateNew && inputValue.trim()) {
      onCreateNew(inputValue.trim());
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = options.length + (allowCreate && inputValue.trim() ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        } else if (highlightedIndex === options.length && allowCreate && inputValue.trim()) {
          handleCreateNew();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (value) {
          setInputValue(value.label);
        }
        break;
    }
  };

  const handleClear = () => {
    onChange(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  // Check if input has unconfirmed text (typed but not selected/created)
  const hasUnconfirmedInput = inputValue.trim() !== '' && inputValue !== value?.label;

  return (
    <div ref={containerRef} className="relative space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 pr-8 rounded-md border shadow-sm text-sm
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : hasUnconfirmedInput
                ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
          ) : options.length === 0 && !allowCreate ? (
            <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
          ) : (
            <>
              {options.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    px-3 py-2 text-sm cursor-pointer
                    ${highlightedIndex === index ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    ${value?.value === option.value ? 'font-medium' : ''}
                    hover:bg-blue-50
                  `}
                  role="option"
                  aria-selected={value?.value === option.value}
                >
                  {option.label}
                </li>
              ))}

              {/* Create new option */}
              {allowCreate && inputValue.trim() && (
                <li
                  onClick={handleCreateNew}
                  onMouseEnter={() => setHighlightedIndex(options.length)}
                  className={`
                    px-3 py-2 text-sm cursor-pointer border-t border-gray-100
                    ${highlightedIndex === options.length ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    hover:bg-blue-50
                  `}
                  role="option"
                >
                  + Create "{inputValue.trim()}"
                </li>
              )}
            </>
          )}
        </ul>
      )}

      {/* Warning for unconfirmed input */}
      {hasUnconfirmedInput && !isOpen && !error && (
        <p className="text-sm text-amber-600">
          Select from results or click "+ Create" to add this {label?.toLowerCase() || 'option'}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
