import type { Meta, StoryObj } from '@storybook/react';
import Button from './button';

// Define the metadata for the component
const meta: Meta<typeof Button> = {
  component: Button,
  title: 'UI/Button',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'danger', 'ghost', 'link'],
      description: 'The visual style of the button'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button'
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state'
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Whether the button should take up the full width of its container'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary button (default style)
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary'
  },
};

// Secondary button
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary'
  },
};

// Outline button
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline'
  },
};

// Danger button
export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger'
  },
};

// Ghost button
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost'
  },
};

// Link button
export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link'
  },
};

// Loading state
export const Loading: Story = {
  args: {
    children: 'Loading Button',
    isLoading: true,
    variant: 'primary'
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
    variant: 'primary'
  },
};

// Small size
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
    variant: 'primary'
  },
};

// Large size
export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
    variant: 'primary'
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    isFullWidth: true,
    variant: 'primary'
  },
  parameters: {
    layout: 'padded',
  },
};

// With left icon
export const WithLeftIcon: Story = {
  args: {
    children: 'Button with Icon',
    variant: 'primary',
    leftIcon: <span>👈</span>
  },
};

// With right icon
export const WithRightIcon: Story = {
  args: {
    children: 'Button with Icon',
    variant: 'primary',
    rightIcon: <span>👉</span>
  },
};