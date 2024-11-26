# GPAC Monitoring Dashboard

Real-time multimedia monitoring dashboard for GPAC framework, built with React and optimized for performance.

## Features

- 📊 Interactive pipeline visualization
- 🎵 Audio/Video stream monitoring
- 📈 System metrics tracking
- 🔄 WebSocket-based live updates

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure
```
src/
├── components/          # React components
│   ├── widgets/        # Monitoring widgets
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── services/           # WebSocket & API services
├── store/              # Redux store & slices
└── types/              # TypeScript types
```

## Core Technologies
- React + TypeScript
- Redux Toolkit
- WebSocket
- GPAC Framework

## Performance Optimizations
- Redux state memoization
- WebSocket message throttling
- React render optimization
- Efficient data flow

## Available Widgets
- GraphMonitor: Pipeline visualization
- AudioMonitor: Audio stream analysis
- VideoMonitor: Video stream preview
- MetricsMonitor: System metrics


## Development
- Install React DevTools
- Enable Redux DevTools
- Monitor render count in console
- Use provided ESLint config

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Open a pull request
