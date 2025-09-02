# Overview

This is a file conversion and optimization platform built with Next.js 14+. The application provides tools for converting various file formats (PDFs, images) and optimizing them for web use. It features a modern, futuristic design with glass morphism effects, neon accents, and smooth animations throughout the user interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 14 with App Router for modern React development and server-side rendering capabilities.

**Styling**: 
- Tailwind CSS for utility-first styling with custom configuration
- Custom CSS variables for theming with a dark futuristic aesthetic
- Glass morphism effects and neon accent colors for visual appeal
- Framer Motion for smooth animations and transitions

**UI Components**:
- Shadcn/ui component library with Radix UI primitives for accessibility
- Custom components built on top of base UI components
- Responsive design with mobile-first approach

**Type Safety**: Full TypeScript implementation with strict configuration for better development experience and code reliability.

## Component Structure

**Layout Components**:
- Header with navigation and mobile menu support
- Footer with newsletter signup and social links
- Logo component with animated effects

**Feature Components**:
- Hero section with typewriter animation effects
- Tools showcase with tabbed interface for different tool categories
- How It Works section with step-by-step process visualization
- Pricing section with toggle between monthly/yearly billing
- FAQ section with accordion interface
- Social proof testimonials

**Tool Pages**:
- PDF tools (compress, split, merge)
- Image tools (format conversion, optimization)
- Individual tool pages with upload interfaces

## Design System

**Color Scheme**: Dark futuristic theme with purple/pink neon accents, glass effect backgrounds, and carefully crafted gradients.

**Typography**: 
- Orbitron font for headings (futuristic feel)
- Inter font for body text (readability)
- Responsive font scaling

**Animation Strategy**: Motion-first approach with Framer Motion, respecting user's reduced motion preferences for accessibility.

## Visual Editing Integration

The application includes a sophisticated visual editing system:
- Component tagging loader for development-time component identification
- Visual edits messenger for real-time preview capabilities
- Error reporting system with iframe communication
- Route change messaging for navigation tracking

## External Dependencies

**UI Framework**: 
- Next.js 14+ for React framework and SSR
- TypeScript for type safety
- Tailwind CSS for styling

**Animation Library**: Framer Motion for smooth transitions and micro-interactions

**Component Libraries**:
- Radix UI primitives for accessible base components
- Shadcn/ui for pre-built component patterns
- Lucide React for consistent iconography

**Development Tools**:
- Babel parser for code analysis
- Magic string for code transformations
- ESTree walker for AST traversal

**Visual Effects**:
- Three.js ecosystem (@react-three/fiber, @react-three/drei) for 3D elements
- TSParticles for background particle effects
- Number Flow React for animated number counters

**Form Handling**: React Hook Form with Zod resolvers for type-safe form validation

**External Scripts**: Supabase-hosted route messenger script for advanced iframe communication and analytics tracking

The architecture prioritizes modern web standards, accessibility, performance, and developer experience while maintaining a cohesive futuristic design language throughout the application.