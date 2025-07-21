# Project Architecture Documentation

## Overview
**win-98-website** is a nostalgic Windows 98-themed interactive website built with modern React technology designed to showcase an artist's work and portfolio. The project recreates the classic Windows 98 desktop experience complete with draggable windows, desktop icons, CRT monitor effects, and authentic retro aesthetics using the 98.css library. It features an immersive intro video system, window management capabilities, and responsive design that works across desktop and mobile devices.

**Primary Purpose**: This is an artist showcase website where every UX decision should prioritize content consumption and user engagement with the artist's work. The Windows 98 aesthetic serves as an interactive gallery interface rather than a fully functional desktop environment.

## Technology Stack

### Core Framework & Build Tools
- **React 19.0.0** - Main UI framework with latest features
- **TypeScript 5.7.2** - Type safety and enhanced development experience
- **Vite 6.1.0** - Fast build tool and development server
- **@vitejs/plugin-react 4.3.4** - React support for Vite

### Styling & UI
- **98.css 0.1.20** - Windows 98 authentic styling library
- **Tailwind CSS 4.0.4** - Modern utility-first CSS framework with @tailwindcss/vite plugin
- **tailwind-merge 3.0.1** - Utility for merging Tailwind classes
- **clsx 2.1.1** - Conditional className utility

### Development Tools
- **ESLint 9.19.0** - Code linting with TypeScript and React plugins
- **TypeScript ESLint 8.22.0** - TypeScript-specific linting rules
- **Globals 15.14.0** - Global variable definitions for ESLint

## Project Structure

```
franciscoskt/
├── public/                     # Static assets
│   ├── bg.jpg                 # Desktop background image
│   ├── intro.webm             # Intro video file
│   ├── mouse-click.wav        # UI sound effect
│   ├── vite.svg               # Vite logo
│   └── icons/                 # Windows 98 style desktop icons
│       ├── camera3_vid-2.png  # Movies icon
│       ├── camera3-2.png      # Images icon
│       ├── computer_explorer_cool-0.png # Computer icon
│       ├── modem-5.png        # Contact icon
│       ├── msagent-3.png      # Shop icon
│       └── ...                # Other desktop icons
├── src/
│   ├── components/            # React components
│   │   ├── CRTEffect.tsx      # CRT monitor visual effects
│   │   ├── desktop-icon.tsx   # Individual desktop icon component
│   │   ├── desktop.tsx        # Desktop layout with icons
│   │   ├── IntroVideo.tsx     # Intro video player with effects
│   │   ├── Modal.tsx          # Start menu modal component
│   │   ├── navbar.tsx         # Windows 98 taskbar
│   │   ├── VintageTransition.tsx # Screen transition effects
│   │   ├── Window.tsx         # Draggable window component
│   │   ├── WindowContents.tsx # Dynamic window content renderer
│   │   └── WindowManager.tsx  # Window orchestration
│   ├── contexts/
│   │   └── WindowContext.tsx  # Global window state management
│   ├── hooks/
│   │   └── useModal.ts        # Modal state management hook
│   ├── utils/
│   │   └── cn.ts             # Tailwind class merging utility
│   ├── assets/               # React/component assets
│   ├── app.css              # Global CSS with zoom fixes
│   ├── tailwind.css         # Tailwind imports
│   ├── main.tsx             # React app entry point
│   └── App.tsx              # Main application component
├── eslint.config.js         # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TypeScript config
├── tsconfig.node.json      # Node-specific TypeScript config
└── vite.config.ts          # Vite build configuration
```

## Core Components

### Design Philosophy
**Content-First Approach**: Every component and interaction is designed to showcase the artist's work effectively. The Windows 98 aesthetic serves as an engaging, nostalgic interface that draws users into exploring the artist's portfolio. Features are implemented based on their value for content discovery and consumption rather than desktop application completeness.

### 1. Application Root (`App.tsx`)
- **Responsibilities**: Main application orchestration, intro video flow, sound effects, global CRT effects
- **Key Features**: 
  - Intro video sequence with vintage transition
  - Global click sound effects
  - CRT monitor simulation wrapper
  - Window provider context initialization

### 2. Window Management System
**WindowContext.tsx**
- **Purpose**: Centralized state management for all windows
- **Features**: 
  - Multi-window state (open, minimized, positioned)
  - Responsive positioning with mobile/desktop adaptations
  - Window stacking (z-index) management
  - Cascade positioning for multiple windows
  - Zoom-aware positioning calculations

**Window.tsx**
- **Purpose**: Individual draggable window component
- **Features**:
  - Cross-platform drag support (mouse + touch)
  - Boundary constraint system
  - Zoom-level awareness for accurate positioning
  - Windows 98 authentic styling with title bars
  - Minimize, maximize, close controls

**WindowManager.tsx**
- **Purpose**: Renders and manages all active windows
- **Features**: Dynamic z-index stacking, window lifecycle management

### 3. Desktop Environment
**Desktop.tsx**
- **Purpose**: Artist portfolio navigation through themed desktop icons
- **Content**: 14 curated desktop icons representing different aspects of the artist's work (Movies, Images, Computer, Contact, etc.)
- **UX Focus**: Intuitive content discovery with clear visual hierarchy

**DesktopIcon.tsx**
- **Purpose**: Interactive portfolio entry points that launch content windows
- **Features**: Click-to-explore content functionality, Windows 98 icon styling
- **UX Focus**: Clear affordances for content exploration

**Navbar.tsx**
- **Purpose**: Windows 98 taskbar providing navigation context and ambiance
- **Features**: Real-time clock updates, Start menu integration
- **UX Focus**: Maintains immersive experience without overwhelming content

### 4. Visual Effects System
**CRTEffect.tsx**
- **Purpose**: Authentic CRT monitor simulation
- **Effects**: Scanlines, screen flicker, vignette, noise texture, brightness variations

**IntroVideo.tsx** 
- **Purpose**: Immersive intro video player
- **Features**: Fullscreen video playback, CRT effects overlay, skip functionality, error handling

**VintageTransition.tsx**
- **Purpose**: Screen transition effects between intro and main interface
- **Effects**: Fade animations with scan line effects

### 5. Content Management
**WindowContents.tsx**
- **Purpose**: Dynamic artist content renderer optimized for consumption
- **Supported Types**: Movies (video portfolio), Images (art gallery), Computer (project files), Contact (artist info)
- **UX Focus**: Content is king - layouts prioritize readability, visual impact, and easy navigation

## Data Flow

### Window Lifecycle
1. **Icon Click** → `DesktopIcon` calls `openWindow()`
2. **Context Update** → `WindowContext` manages window state
3. **Rendering** → `WindowManager` renders active windows
4. **User Interaction** → Window drag/close actions update context
5. **State Persistence** → Window positions and states maintained

### Application Startup Flow
1. **Initial Load** → `App.tsx` initializes with intro video
2. **Video Playback** → `IntroVideo` component handles playback
3. **Transition** → `VintageTransition` provides smooth transition
4. **Desktop Ready** → Main interface becomes interactive
5. **Sound System** → Global click sounds activated

### Responsive Behavior
- **Desktop (≥1024px)**: 1.25x zoom for enhanced visibility
- **Mobile (<768px)**: Constrained window sizes, touch-optimized interactions
- **Firefox Compatibility**: Transform-based scaling instead of zoom

## API Documentation
*Note: This is a frontend-only application with no external APIs*

### Internal Component APIs

#### WindowContext
```typescript
interface WindowContextType {
  windows: Window[];
  openWindow: (window: Omit<Window, "isOpen" | "isMinimized" | "position">) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setWindowPosition: (id: string, position: { x: number; y: number }) => void;
  setWindowSize: (id: string, size: { width: number; height: number }) => void;
}
```

#### Window Interface
```typescript
interface Window {
  id: string;
  title: string;
  content: ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}
```

## Database Schema
*Not applicable - This is a static frontend application with no database persistence*

## Configuration

### Environment Setup
- **Node.js**: Compatible with modern Node versions
- **Package Manager**: Uses `pnpm` (lockfile present)
- **Build Target**: ES2020, modern browsers

### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### Tailwind Configuration
- **Custom Animations**: scan, flicker, fade for CRT effects
- **Custom Backgrounds**: radial-gradient, noise texture
- **Content Sources**: HTML and all TypeScript/JSX files

### TypeScript Configuration
- **Project Structure**: Split configuration (app, node, root)
- **Strict Mode**: Enabled for type safety
- **Module System**: ESNext with bundler resolution

## Development Workflow

### Available Scripts
```json
{
  "dev": "vite",           // Development server with HMR
  "build": "tsc -b && vite build",  // Type check + production build
  "lint": "eslint .",      // Code linting
  "preview": "vite preview" // Preview production build
}
```

### Development Process
1. **Local Development**: `pnpm dev` starts Vite dev server
2. **Code Quality**: ESLint with React and TypeScript rules
3. **Type Safety**: Full TypeScript checking before build
4. **Hot Reload**: Vite provides fast HMR during development

### Build Process
1. **Type Checking**: TypeScript compilation verification
2. **Bundling**: Vite processes and optimizes all assets
3. **Asset Processing**: Images, videos, sounds bundled appropriately
4. **CSS Processing**: Tailwind purged and optimized

## Code Conventions

### UX Design Principles
- **Content Accessibility**: Ensure all artist work is easily discoverable and consumable
- **Visual Hierarchy**: Prioritize content over interface elements
- **Performance**: Optimize for content loading and viewing experience
- **Mobile Optimization**: Content must be fully accessible on mobile devices
- **Engagement**: Interactive elements should enhance, not distract from, content consumption

### File Organization
- **Components**: PascalCase filenames (`Window.tsx`)
- **Hooks**: camelCase with `use` prefix (`useModal.ts`)
- **Utilities**: camelCase (`cn.ts`)
- **Assets**: Descriptive names in public folder

### Naming Conventions
- **Components**: PascalCase exports
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **CSS Classes**: Tailwind utilities + 98.css classes

### React Patterns
- **Hooks**: Custom hooks for reusable stateful logic
- **Context**: Single provider for global window state
- **Components**: Functional components with TypeScript interfaces
- **Props**: Explicit interface definitions for all components

### TypeScript Usage
- **Strict Mode**: All files use strict TypeScript
- **Interface Over Type**: Interfaces for object shapes
- **Generic Types**: Where beneficial for reusability
- **Explicit Returns**: Function return types for public APIs

## Known Issues & Technical Debt

### Content-First Considerations
- **Content Loading**: Large media files should have progressive loading for better UX
- **Gallery Navigation**: Could benefit from keyboard shortcuts for content browsing
- **Content Search**: No search functionality for finding specific artist works
- **Content Metadata**: Limited information display about individual pieces

### Cross-Browser Compatibility
- **Firefox Zoom Issue**: Requires transform-based scaling workaround
- **Touch Events**: Some older mobile browsers may have interaction issues
- **Video Formats**: Fallback needed for browsers not supporting WebM

### Performance Considerations
- **CRT Effects**: Heavy use of CSS animations may impact lower-end devices
- **Window Dragging**: Multiple event listeners could be optimized
- **Asset Loading**: Large intro video file affects initial load time

### Mobile Experience
- **Small Screens**: Some window content may be cramped on very small screens
- **Touch Interactions**: Could benefit from better touch feedback
- **Keyboard Navigation**: Limited accessibility for keyboard-only users

### Technical Debt
1. **Hardcoded Values**: Some magic numbers in positioning calculations
2. **Error Boundaries**: No React error boundaries for component failure handling
3. **Loading States**: Limited loading feedback for video and asset loading
4. **Testing**: No automated tests implemented
5. **Accessibility**: ARIA labels and keyboard navigation could be improved

### Future Improvements
- **Content Management**: Better organization and categorization of artist works
- **SEO Optimization**: Meta tags and structured data for better discoverability
- **Social Sharing**: Easy sharing of individual portfolio pieces
- **Content Analytics**: Understanding user engagement with different works
- **Progressive Enhancement**: Better handling of JavaScript disabled scenarios
- **Performance**: Implement intersection observer for efficient CRT effects
- **Accessibility**: Full WCAG compliance implementation focused on content accessibility
- **Internationalization**: Multi-language support for global artist reach
- **Portfolio Features**: Filtering, sorting, and detailed view capabilities

## Update Instructions

This document should be updated whenever:
- New features or components are added
- Architectural decisions are made or changed
- Dependencies are added, updated, or removed
- API contracts change (component interfaces)
- Build process or development workflow changes
- Performance optimizations are implemented
- Bug fixes that affect architecture understanding

### To update:
1. Review changes in the codebase since last update
2. Reflect changes in the relevant sections above
3. Use git commits as reference points for tracking changes
4. Update the timestamp and identifier below
5. Consider if the change affects other sections (cross-references)

### Versioning Reference
- **Git Commit Hash**: Use `git log --oneline -1` for latest commit reference
- **Dependency Changes**: Check `package.json` for version bumps
- **Feature Changes**: Review component additions/modifications in `src/components/`

---

**Last Updated**: July 21, 2025  
**Updated By**: GitHub Copilot Architecture Analysis Agent  
**Codebase Version**: Current main branch state  
**Dependencies Last Checked**: July 21, 2025
