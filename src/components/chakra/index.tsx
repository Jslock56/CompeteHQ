'use client';

import React from 'react';
// Revert to original imports to fix build errors
import {
  Button as ChakraButton,
  Input as ChakraInput,
  Select as ChakraSelect,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  BoxProps,
  ButtonProps,
  InputProps,
  SelectProps
} from '@chakra-ui/react';

// Define the SelectOption type for reuse
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Extended Button props interface
export interface ExtendedButtonProps extends ButtonProps {
  isFullWidth?: boolean;
}

// Button component
export const Button = React.forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  (props, ref) => {
    const { 
      children, 
      variant = 'primary', 
      size = 'md', 
      isLoading, 
      isFullWidth, 
      leftIcon, 
      rightIcon, 
      ...rest 
    } = props;
    
    // Map custom variants to Chakra variants
    let colorScheme;
    let chakraVariant;
    
    switch (variant) {
      case 'primary':
        colorScheme = 'primary';
        chakraVariant = 'solid';
        break;
      case 'secondary':
        colorScheme = 'secondary';
        chakraVariant = 'solid';
        break;
      case 'outline':
        colorScheme = 'primary';
        chakraVariant = 'outline';
        break;
      case 'danger':
        colorScheme = 'red';
        chakraVariant = 'solid';
        break;
      case 'ghost':
        colorScheme = 'gray';
        chakraVariant = 'ghost';
        break;
      case 'link':
        colorScheme = 'primary';
        chakraVariant = 'link';
        break;
      default:
        colorScheme = 'primary';
        chakraVariant = 'solid';
    }
    
    return (
      <ChakraButton
        ref={ref}
        size={size}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        isLoading={isLoading}
        width={isFullWidth ? 'full' : undefined}
        colorScheme={colorScheme}
        variant={chakraVariant}
        {...rest}
      >
        {children}
      </ChakraButton>
    );
  }
);

Button.displayName = 'Button';

// Extended Input props interface
export interface ExtendedInputProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

// Input component
export const Input = React.forwardRef<HTMLInputElement, ExtendedInputProps>(
  (props, ref) => {
    const { label, error, helperText, id, ...rest } = props;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : '');
    
    return (
      <FormControl isInvalid={!!error}>
        {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}
        <ChakraInput ref={ref} id={inputId} {...rest} />
        {error ? (
          <FormErrorMessage>{error}</FormErrorMessage>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </FormControl>
    );
  }
);

Input.displayName = 'Input';

// Extended Select props interface
export interface ExtendedSelectProps extends SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

// Select component
export const Select = React.forwardRef<HTMLSelectElement, ExtendedSelectProps>(
  (props, ref) => {
    const { label, error, helperText, options, id, children, ...rest } = props;
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : '');
    
    return (
      <FormControl isInvalid={!!error}>
        {label && <FormLabel htmlFor={selectId}>{label}</FormLabel>}
        <ChakraSelect ref={ref} id={selectId} {...rest}>
          {options ? (
            options.map((option) => (
              <option 
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </ChakraSelect>
        {error ? (
          <FormErrorMessage>{error}</FormErrorMessage>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </FormControl>
    );
  }
);

Select.displayName = 'Select';

// FormGroup component for grouping form controls
export const FormGroup: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box mb={4} {...props}>
      {children}
    </Box>
  );
};

// Export the original Chakra UI components as well
export {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText
};