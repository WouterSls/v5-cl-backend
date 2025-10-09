# Yearn Token Lists

This module uses curated token lists from [Yearn's tokenLists repository](https://github.com/yearn/tokenLists) for token metadata and security filtering.

## Purpose

1. **Token Metadata** - Provides accurate token names, symbols, decimals, and logos
2. **Security Filter** - Acts as an allowlist to block potentially malicious tokens

## Supported Chains

- **Ethereum Mainnet** (chainId: 1) - ~1,113 tokens
- **Base** (chainId: 8453) - ~1,442 tokens

## File Structure

```
yearn/
├── README.md                    # This file
├── yearn-utils.ts               # Token list utilities (lazy loading & lookups)
├── yearn-token-list.types.ts   # TypeScript types
└── data/
    ├── 1-tokens.json           # Ethereum token list (~290KB)
    └── 8453-tokens.json        # Base token list (~316KB)
```

## How It Works

Token lists are **lazy loaded** on first request per chain:
- ✅ Instant server startup (~120ms)
- ✅ Fast lookups (in-memory Map)
- ✅ Only loads data when needed

## Updating Token Lists

Token lists should be updated periodically (weekly or monthly) to include new tokens.

### Quick Update (2 steps):

**Step 1:** Download latest lists
```bash
npm run update-tokens
```

**Step 2:** Rebuild to copy files to build directory
```bash
npm run build
# or restart dev server
npm run dev
```

### Manual curl commands:

```bash
# Ethereum Mainnet
curl -o src/resources/blockchain/external-apis/yearn/data/1-tokens.json \
  https://raw.githubusercontent.com/yearn/tokenLists/main/lists/1.json

# Base
curl -o src/resources/blockchain/external-apis/yearn/data/8453-tokens.json \
  https://raw.githubusercontent.com/yearn/tokenLists/main/lists/8453.json

# Don't forget to rebuild!
npm run build
```

**Important:** TypeScript doesn't copy JSON files automatically, so you must rebuild after updating token lists.

## Token List Sources

- Ethereum: [lists/1.json](https://github.com/yearn/tokenLists/blob/main/lists/1.json)
- Base: [lists/8453.json](https://github.com/yearn/tokenLists/blob/main/lists/8453.json)

## Performance

- **Startup**: ~120ms (lazy loading - no token lists loaded)
- **First request per chain**: 50-100ms (loads and caches token list)
- **Subsequent requests**: <1ms (cached in memory)

## Security

Tokens **not** in the Yearn list are:
1. Built with default metadata (symbol: "UNKNOWN")
2. **Filtered out** automatically (security protection)

This blocks phishing tokens, scams, and honeypots from appearing in your wallet.
