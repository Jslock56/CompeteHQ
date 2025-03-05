import React from 'react';
import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Select as ChakraSelect,
  SelectProps as ChakraSelectProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
// Button component
export const Button = React.forwardRef<HTMLButtonElement, ChakraButtonProps & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  isFullWidth?: boolean;
  size?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
}>((props, ref) => {
export const Button = React.forwardRef((props: any, ref) => {
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
    >
      {children}
    </ChakraButton>
  );
});

Button.displayName = 'Button';

// Input component
export const Input = React.forwardRef<HTMLInputElement, ChakraInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
}>((props, ref) => {
  const inputId = id || (label && label.toLowerCase().replace(/\s+/g, '-')) || '';
  
  return (
    <FormControl isInvalid={!!error}>
      {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}
      <ChakraInput ref={ref} id={inputId} {...rest} />
      {error ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
});

Input.displayName = 'Input';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

// Select component
export const Select = React.forwardRef<HTMLSelectElement, ChakraSelectProps & {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  id?: string;
}>((props, ref) => {
  const { label, error, helperText, options, id, children, ...rest } = props;
  const selectId = id || (label && label.toLowerCase().replace(/\s+/g, '-')) || '';
  
  return (
    <FormControl isInvalid={!!error}>
      {label && <FormLabel htmlFor={selectId}>{label}</FormLabel>}
      <ChakraSelect ref={ref} id={selectId} {...rest}>
        {options ? (
          options.map((option: SelectOption) => (
            <option 
              key={option.value}
              value={option.value}
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
});

Select.displayName = 'Select';

// FormGroup component for grouping form controls
export const FormGroup: React.FC<React.ComponentProps<typeof Box>> = ({ children, ...props }) => {
              key={option.value} 
// FormGroup component for grouping form controls
export const FormGroup: React.FC<React.ComponentProps<typeof Box>> = ({ children, ...props }) => {
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
});

Select.displayName = 'Select';

// FormGroup component for grouping form controls
export const FormGroup = ({ children, ...props }: any) => {
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