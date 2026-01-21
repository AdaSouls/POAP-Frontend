# POAP Frontend Application

A React-based frontend application for managing POAP (Proof of Attendance Protocol) tokens, events, and collections. The application supports Ethereum blockchains with wallet integration.

## Summary

This frontend application provides a comprehensive interface for:
- **Event Management**: Create and manage POAP events with backend integration
- **Token Minting**: Mint POAP tokens directly from smart contracts
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and Cardano wallets
- **Dual Architecture**: Supports both integrated (Backend + Smart Contracts) and smart contract-only approaches

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher) or **yarn**
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

1. **Navigate to the App directory:**
   ```bash
   cd App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   Or if you prefer yarn:
   ```bash
   yarn install
   ```

3. **Verify installation:**
   ```bash
   npm list --depth=0
   ```

## Running the Application

### Development Mode

Start the development server:
```bash
npm start
```

The application will open automatically in your browser at `http://localhost:3000`. The page will reload automatically when you make changes to the code.

### Build for Production

Create an optimized production build:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory. This build is ready to be deployed to any static hosting service.

### Running Tests

Run the test suite:
```bash
npm test
```

This will launch the test runner in interactive watch mode. Press `a` to run all tests, or press `q` to quit.

To run tests once without watch mode:
```bash
CI=true npm test
```

## Project Structure

```
App/
├── public/              # Static assets
├── src/
│   ├── jsx/
│   │   ├── components/  # Reusable React components
│   │   ├── contexts/    # React context providers
│   │   ├── drawer/     # Drawer components and views
│   │   ├── layout/     # Layout components (header, sidebar)
│   │   ├── pages/      # Page components
│   │   └── router.jsx  # Application routing
│   ├── services/       # API and blockchain service files
│   ├── utils/          # Utility functions
│   ├── __tests__/      # Test files
│   └── App.js          # Main App component
├── package.json        # Dependencies and scripts
└── craco.config.js     # CRACO configuration
```

## Key Features

### Event Management
- Create events with backend integration
- View all events and event details
- Real-time data synchronization

### POAP Token Operations
- Mint POAP tokens directly from smart contracts
- View your token collection

### Wallet Integration
- Connect Ethereum wallets (MetaMask, WalletConnect)
- View wallet status and balance
- Transaction management

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- **React** 18.2.0 - UI library
- **React Router** 6.22.3 - Routing
- **React Bootstrap** 1.4.0 - UI components
- **Ethers.js** 6.13.1 - Ethereum blockchain interaction
- **Web3** 1.2.2 - Web3 utilities
- **WalletConnect** - Wallet connection protocol
- **CRACO** - Create React App Configuration Override
- **TypeScript** - Type checking (partial)

## Configuration

The application uses CRACO (Create React App Configuration Override) for custom webpack configuration. The configuration file (`craco.config.js`) includes:
- WebAssembly support
- Buffer polyfills for blockchain libraries
- Hot module replacement

## Testing

The application includes comprehensive test coverage:
- Component tests
- Integration tests
- Service tests
- Utility function tests

Test files are located in `src/__tests__/` directory.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can specify a different port:
```bash
PORT=3001 npm start
```

### Module Not Found Errors
If you encounter module not found errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
If the build fails, ensure all dependencies are installed:
```bash
npm install
npm run build
```

## Browser Support

The application supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write or update tests
4. Ensure all tests pass
5. Submit a pull request

## License

This project is private and proprietary.

