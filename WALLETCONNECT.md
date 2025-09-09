# WalletConnect Integration

WalletConnect has been successfully integrated into the TransactProof application. Users can now connect their wallets using either MetaMask or WalletConnect protocol.

## Features

- **Multiple Wallet Options**: Users can choose between MetaMask and WalletConnect
- **Dropdown Interface**: Clean dropdown menu for wallet selection
- **Connection Status**: Visual indicators showing connection type and network
- **Network Support**: Supports multiple networks including Base, Ethereum, Polygon, Arbitrum, and Optimism
- **Seamless Authentication**: Uses SIWE (Sign-In with Ethereum) for both connection types

## Setup

### Environment Variables

Make sure to set your WalletConnect Project ID in `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

You can get a Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Supported Networks

- Ethereum Mainnet (`0x1`)
- Base Mainnet (`0x2105`)
- Base Sepolia (`0x14a34`) - Default testnet
- Polygon Mainnet (`0x89`)
- Arbitrum One (`0xa4b1`)
- Optimism Mainnet (`0xa`)

## Usage

### For Users

1. Click "Connect Wallet" button
2. Choose connection method:
   - **MetaMask**: Direct browser extension connection
   - **WalletConnect**: QR code or deep linking to mobile wallets
3. Follow wallet prompts to approve connection
4. Sign authentication message to complete login

### Connection Flow

1. **Connection**: User selects wallet type and establishes connection
2. **Network Check**: App verifies supported network (switches to Base Sepolia if needed)
3. **Authentication**: User signs SIWE message for secure authentication
4. **Session**: User gains access to protected features

## Technical Implementation

### Key Components

- `WalletConnectProvider`: React context for WalletConnect state management
- `useWalletConnect`: Hook for accessing WalletConnect functionality
- `ConnectButton`: Updated UI component supporting both connection types
- `AuthProvider`: Enhanced to support custom signing functions

### Files Modified/Added

- `src/contexts/walletconnect-context.tsx` - WalletConnect provider
- `src/components/connect-button.tsx` - Updated connect button
- `src/contexts/auth-context.tsx` - Enhanced auth with custom signer support
- `src/app/providers.tsx` - Added WalletConnect provider

### Dependencies Added

- `@walletconnect/sign-client` - Core WalletConnect functionality
- `@walletconnect/utils` - Utility functions
- `@walletconnect/universal-provider` - Universal provider for multiple chains
- `@walletconnect/modal` - Modal interface for QR codes

## Troubleshooting

### Common Issues

1. **Project ID Missing**: Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
2. **Network Issues**: App automatically switches to supported networks
3. **Connection Timeout**: WalletConnect sessions expire, users need to reconnect
4. **Mobile Compatibility**: WalletConnect works best with mobile wallet apps

### Testing

- Test with different wallet apps (MetaMask, Rainbow, Trust Wallet, etc.)
- Verify network switching functionality
- Test connection persistence across browser sessions
- Verify authentication flow with both connection types

## Security Considerations

- Project ID is public and safe to expose in frontend
- SIWE authentication provides secure session management
- No private keys are ever stored or transmitted
- Sessions are managed server-side with proper validation