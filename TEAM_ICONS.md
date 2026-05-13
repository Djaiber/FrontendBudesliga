# Team Icons Implementation

## Overview
Added SVG-based team icons for Bundesliga clubs with proper branding colors and designs.

## Implemented Team Icons

### 1. **Borussia Dortmund (BVB)**
- Colors: Yellow (#FDE100) and Black
- Design: Circular badge with "BVB 09" text
- File: `src/components/icons/TeamIcons.tsx` - `BVBIcon`

### 2. **Bayern München (FCB)**
- Colors: Red (#DC052D) and Blue (#0066B2)
- Design: Circular badge with Bavarian diamond pattern
- File: `src/components/icons/TeamIcons.tsx` - `FCBIcon`

### 3. **RB Leipzig (RBL)**
- Colors: Red (#DD0741) and White
- Design: Circular badge with "RB Leipzig" text
- File: `src/components/icons/TeamIcons.tsx` - `RBLIcon`

### 4. **VfL Wolfsburg (WOB)**
- Colors: Green (#65B32E) and White
- Design: Circular badge with "VfL Wolfsburg" text
- File: `src/components/icons/TeamIcons.tsx` - `WOBIcon`

### 5. **TSG Hoffenheim (TSG)**
- Colors: Blue (#1961B5) and White
- Design: Circular badge with "TSG" text
- File: `src/components/icons/TeamIcons.tsx` - `TSGIcon`

### 6. **Bayer Leverkusen (B04)**
- Colors: Red (#E32221) and Black
- Design: Circular badge with "B04 Leverkusen" text
- File: `src/components/icons/TeamIcons.tsx` - `B04Icon`

### 7. **Borussia Mönchengladbach (BMG)**
- Colors: Black and Green (#00A650)
- Design: Circular badge with "BMG" text
- File: `src/components/icons/TeamIcons.tsx` - `BMGIcon`

### 8. **VfB Stuttgart (VFB)**
- Colors: Red (#E32219) and White
- Design: Circular badge with "VfB Stuttgart" text
- File: `src/components/icons/TeamIcons.tsx` - `VFBIcon`

### 9. **Eintracht Frankfurt (SGE)**
- Colors: Red (#E1000F), Black, and White
- Design: Circular badge with eagle star emblem
- File: `src/components/icons/TeamIcons.tsx` - `SGEIcon`

### 10. **Generic Team Icon**
- Colors: Dark gray (#2a2a2a)
- Design: Fallback for teams without specific icons
- Shows team abbreviation
- File: `src/components/icons/TeamIcons.tsx` - `GenericTeamIcon`

## Component Structure

### TeamLogo Component
**Location:** `src/components/TeamLogo.tsx`

**Props:**
- `team: string` - Team abbreviation (e.g., "BVB", "FCB")
- `size?: 'small' | 'medium' | 'large'` - Icon size (default: 'medium')
- `className?: string` - Additional CSS classes

**Sizes:**
- `small`: 28px
- `medium`: 40px (default)
- `large`: 64px

**Usage Example:**
```tsx
import TeamLogo from '../components/TeamLogo';

<TeamLogo team="BVB" size="medium" />
<TeamLogo team="FCB" size="large" />
```

## Features

✅ **SVG-based** - Scalable vector graphics for crisp rendering at any size
✅ **Brand accurate** - Uses official team colors
✅ **Hover effects** - Smooth scale animation on hover
✅ **Fallback support** - Generic icon for teams without specific designs
✅ **Type-safe** - Full TypeScript support
✅ **Responsive** - Three size variants for different use cases

## Integration

The TeamLogo component is integrated into:
- Homepage match cards (`src/pages/HomePage.tsx`)
- Can be used in Live Predict match listings
- Can be used in match detail views
- Can be used in standings tables

## Adding New Team Icons

To add a new team icon:

1. Open `src/components/icons/TeamIcons.tsx`
2. Create a new icon component following the existing pattern:
```tsx
export function NEWIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {/* Your SVG design here */}
    </svg>
  );
}
```
3. Add the icon to the `TeamIconsMap`:
```tsx
export const TeamIconsMap = {
  // ... existing icons
  NEW: NEWIcon,
};
```

## Files Modified/Created

- ✅ `src/components/TeamLogo.tsx` - Main component
- ✅ `src/components/TeamLogo.module.css` - Component styles
- ✅ `src/components/icons/TeamIcons.tsx` - SVG icon definitions
- ✅ `src/pages/HomePage.tsx` - Updated to use TeamLogo
- ✅ `src/styles/bundesliga.css` - Removed old team-logo styles

## Browser Support

SVG icons are supported in all modern browsers:
- Chrome/Edge 12+
- Firefox 4+
- Safari 5+
- Opera 11.6+

## Performance

- Lightweight: Each icon is ~1-2KB
- No external dependencies
- Inline SVG for optimal performance
- No HTTP requests for icons
