
# GPAC Monitoring Dashboard

Real-time multimedia monitoring dashboard for GPAC.

## Features

- 📊 Interactive pipeline visualization
- 📈 Filters metrics monitoring
- 🔄 WebSocket-based live updates

## Installation

### Prerequisites
- GPAC installed and configured
- Node.js and npm installed
- Access to multimedia files for testing

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev



### Running the Example

1. **Start the GPAC Server**
```bash
# Navigate to server directory
cd Graph_Monitor/server

# Launch GPAC with monitoring script
# Example command for monitoring MP4 file:
gpac -js=mx.js -i file.mp4 vout -graph -rmt
```

2. **Launch the Development Server**
```bash
# Navigate to project root
cd Graph_Monitor

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The dashboard should now be accessible at `http://localhost:5173` (or your configured port).

### Troubleshooting
- If WebSocket connection fails, ensure GPAC server is running and restart mx.js if necessary
- Check console for detailed error messages
- Verify port availability (default: 17815 for WebSocket)

**Note**: If you encounter WebSocket connection errors, try restarting the mx.js script. This can help resolve initialization timing issues.

## Architecture

### Project Structure
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

### Core Technologies
- React + TypeScript
- Redux Toolkit
- WebSocket
- GPAC Framework

### Available Widgets
- GraphMonitor: Pipeline visualization
- MultifilterMonitor: Audio stream analysis
- FilterMonitor: Video stream preview

