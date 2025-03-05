# CompeteHQ UI/UX Guidelines

## Core Principles

1. **Simplicity First**: Prioritize easy-to-understand interfaces with clear actions
2. **Mobile-Optimized**: All interfaces must work well on phones and tablets
3. **Consistent Patterns**: Use the same UI patterns across the application
4. **Visual Communication**: Use color and visual cues to convey information

## Component Usage

### Layout Components
- Always use `PageContainer` for page layouts
- Use `Card` for content sections
- Stack components with `VStack` and `HStack`
- Maintain consistent spacing between elements

### Typography
- Page titles: `<Heading as="h1" size="xl">`
- Section titles: `<Heading as="h2" size="lg">`
- Card titles: `<Heading as="h3" size="md">`
- Body text: `<Text>` (default)
- Helper text: `<Text fontSize="sm" color="gray.500">`

### Spacing
- Page padding: `px={{ base: 4, md: 6, lg: 8 }} py={8}`
- Card padding: `p={{ base: 4, md: 6 }}`
- Stacked components: `spacing={4}` or `spacing={6}`
- Between sections: `mb={8}` or `mt={8}`

### Colors
- Primary actions: `colorScheme="primary"`
- Secondary actions: `colorScheme="secondary"` or `variant="outline"`
- Destructive actions: `colorScheme="red"`
- Positions: Always use the `getPositionColor()` function
- Status indicators:
  - Success/Active: `green.500`
  - Warning: `orange.500` 
  - Error/Danger: `red.500`
  - Inactive: `gray.500`

### Forms
- Always use Chakra form components
- Always show validation errors
- Group related fields using `FormControl`
- Include helper text when necessary
- Use consistent labels and placeholder text

## UI Patterns

### Navigation
- Use the left sidebar for primary navigation
- Highlight the active section
- Maintain a breadcrumb trail for complex flows
- Keep actions consistent across similar screens

### Position Badges
- Always use the `PositionBadge` component for position indicators
- Use primary style for primary positions
- Use secondary style for secondary positions
- Include tooltips with position descriptions

### Player Cards
- Use the standard PlayerCard component
- Display jersey number prominently
- Show position badges in a consistent location
- Place actions in the card footer

### Action Patterns
- Primary actions should be right-aligned
- Destructive actions should be styled differently and require confirmation
- Use tooltips for action buttons without labels
- Group related actions together

### Lists and Grids
- Use consistent list/grid patterns for similar content
- Include proper loading states
- Show empty states with helpful guidance
- Maintain consistent sorting and filtering controls

## Page-Specific Guidelines

### Dashboard
- Focus on key metrics at the top
- Group related information in cards
- Provide quick access to common actions

### Team Management
- Show key team information at the top
- List players with consistent cards
- Group management actions together

### Lineup Management
- Keep the grid layout consistent
- Show position recommendations
- Highlight potential issues
- Maintain inning navigation in the same place

### Position Tracking
- Use consistent charts for visualizing position history
- Keep metrics in the same format across screens
- Highlight fair play considerations

### Practice Planning
- Maintain a consistent timeline view
- Group drills in a consistent format
- Keep player assignments clear and readable

## Accessibility Considerations

- Maintain sufficient color contrast
- Ensure all interactive elements are keyboard accessible
- Provide appropriate aria labels
- Support screen readers with proper element roles

## Responsive Design Rules

- Desktop First: Design for desktop, then ensure mobile compatibility
- Breakpoints:
  - base: 0px (mobile)
  - sm: 480px
  - md: 768px
  - lg: 992px
  - xl: 1280px
- Stack vertically on small screens
- Hide non-essential elements on mobile
- Use drawer navigation on mobile