import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { toNumber } from '../../utils/formulas';

interface EditableCellProps {
  value: number | null | undefined;
  onSave: (value: number | null) => void;
  align?: 'left' | 'right' | 'center';
  disabled?: boolean;
  placeholder?: string;
}

export function EditableCell({
  value,
  onSave,
  align = 'right',
  disabled = false,
  placeholder = '0.00',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const formatDisplay = (val: number | null | undefined): string => {
    if (val === null || val === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value !== null && value !== undefined ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = toNumber(editValue);
    onSave(numValue === 0 && editValue.trim() === '' ? null : numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value !== null && value !== undefined ? value.toString() : '');
    }
  };

  if (isEditing) {
    return (
      <TextField
        inputRef={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        size="small"
        variant="standard"
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          sx: { fontSize: '0.875rem' },
        }}
        sx={{
          width: '100%',
          '& .MuiInputBase-input': {
            textAlign: align,
            py: 0.5,
          },
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        textAlign: align,
        padding: '4px 8px',
        minHeight: '32px',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {formatDisplay(value)}
    </span>
  );
}

