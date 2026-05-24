import React from 'react';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { type Dayjs } from 'dayjs';

type BaseProps = {
  label: string;
  value?: string | null;
  onChange: (isoValue: string | null) => void;
  disabled?: boolean;
  className?: string;
  minDate?: string | null;
  maxDate?: string | null;
};

function toDayjs(value?: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

const textFieldSlot = (className?: string) => ({
  textField: {
    size: 'small' as const,
    fullWidth: true,
    className,
  },
});

export const AppDatePicker: React.FC<BaseProps> = ({
  label,
  value,
  onChange,
  disabled,
  className,
  minDate,
  maxDate,
}) => (
  <DatePicker
    label={label}
    value={toDayjs(value)}
    onChange={(next: Dayjs | null) => {
      onChange(next ? next.format('YYYY-MM-DD') : null);
    }}
    disabled={disabled}
    minDate={toDayjs(minDate) ?? undefined}
    maxDate={toDayjs(maxDate) ?? undefined}
    slots={{ textField: TextField }}
    slotProps={textFieldSlot(className)}
  />
);

export const AppDateTimePicker: React.FC<BaseProps> = ({
  label,
  value,
  onChange,
  disabled,
  className,
  minDate,
  maxDate,
}) => (
  <DateTimePicker
    label={label}
    value={toDayjs(value)}
    onChange={(next: Dayjs | null) => {
      onChange(next ? next.toISOString() : null);
    }}
    disabled={disabled}
    minDateTime={toDayjs(minDate) ?? undefined}
    maxDateTime={toDayjs(maxDate) ?? undefined}
    slots={{ textField: TextField }}
    slotProps={textFieldSlot(className)}
  />
);
