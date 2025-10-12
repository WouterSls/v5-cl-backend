import { JsonRpcProvider } from 'ethers';
import { SelectToken } from '../../../src/resources/db/schema';
import { ImportedToken, createImportedToken } from '../../../src/app/wallets/model/ImportedToken';
import { TokenDto } from '../../../src/resources/generated/types';

import * as tokenModule from '../../../src/lib/utils/token';

jest.mock('../../../src/lib/logger/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  }
}));

jest.mock('../../../src/resources/blockchain/external-apis/yearn/yearn-utils', () => ({
  getYearnTokenMetadata: jest.fn().mockImplementation((address: string) => {
    if (address.toLowerCase() === '0xyearntoken1') {
      return {
        name: 'Yearn Token 1',
        symbol: 'YT1',
        decimals: 18,
        logoURI: 'https://yearn.finance/logo.png'
      };
    }
    return null;
  }),
  isTokenInYearnList: jest.fn().mockImplementation((address: string, chainId: number) => {
    return address.toLowerCase() === '0xyearntoken1';
  })
}));

jest.mock('../../../src/resources/blockchain/external-apis/alchemy/AlchemyApi', () => ({
  AlchemyApi: jest.fn().mockImplementation(() => ({
    getEthersProvider: jest.fn((chainId: number) => ({
      call: jest.fn()
    }))
  }))
}));


describe('Token Utility Functions', () => {
  describe('buildImportedTokens', () => {
    it('should build imported tokens with stored metadata when available', async () => {
      const dbTokens: SelectToken[] = [
        {
          id: 1,
          walletAddress: '0xuser',
          tokenAddress: '0xtoken1',
          chainId: 1,
          status: 'IMPORT',
          symbol: 'TKN1',
          name: 'Token 1',
          decimals: 18,
          logo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockProvider = {
        call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000') // 1 token
      } as unknown as JsonRpcProvider;

      const result = await tokenModule.buildImportedTokens('0xuser', dbTokens, mockProvider);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: '0xtoken1',
        name: 'Token 1',
        symbol: 'TKN1',
        decimals: 18
      });
    });

    it('should fetch metadata on-chain when not stored in DB', async () => {
      const dbTokens: SelectToken[] = [
        {
          id: 1,
          walletAddress: '0xuser',
          tokenAddress: '0xtoken2',
          chainId: 1,
          status: 'IMPORT',
          symbol: null,
          name: null,
          decimals: null,
          logo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockProvider = {
        call: jest.fn()
          .mockResolvedValueOnce('0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a546f6b656e204e616d6500000000000000000000000000000000000000000000') // "Token Name"
          .mockResolvedValueOnce('0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003544b4e0000000000000000000000000000000000000000000000000000000000') // "TKN"
          .mockResolvedValueOnce('0x0000000000000000000000000000000000000000000000000000000000000012') // 18
          .mockResolvedValueOnce('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000') // 1 token
      } as unknown as JsonRpcProvider;

      const result = await tokenModule.buildImportedTokens('0xuser', dbTokens, mockProvider);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('0xtoken2');
    });

    it('should filter out non-IMPORT status tokens', async () => {
      const dbTokens: SelectToken[] = [
        {
          id: 1,
          walletAddress: '0xuser',
          tokenAddress: '0xtoken1',
          chainId: 1,
          status: 'IMPORT',
          symbol: 'TKN1',
          name: 'Token 1',
          decimals: 18,
          logo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          walletAddress: '0xuser',
          tokenAddress: '0xtoken2',
          chainId: 1,
          status: 'BLACKLIST',
          symbol: 'TKN2',
          name: 'Token 2',
          decimals: 18,
          logo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockProvider = {
        call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000')
      } as unknown as JsonRpcProvider;

      const result = await tokenModule.buildImportedTokens('0xuser', dbTokens, mockProvider);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('TKN1');
    });

    it('should handle errors gracefully and return default values', async () => {
      const dbTokens: SelectToken[] = [
        {
          id: 1,
          walletAddress: '0xuser',
          tokenAddress: '0xmalicious',
          chainId: 1,
          status: 'IMPORT',
          symbol: null,
          name: null,
          decimals: null,
          logo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockProvider = {
        call: jest.fn().mockRejectedValue(new Error('Contract call failed'))
      } as unknown as JsonRpcProvider;

      const result = await tokenModule.buildImportedTokens('0xuser', dbTokens, mockProvider);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Unknown Token');
      expect(result[0].symbol).toBe('UNKNOWN');
      expect(result[0].balance).toBe('0');
    });
  });

  describe('buildTokens - Imported Token Integration', () => {
    const mockTokenBalances = [
      {
        contractAddress: '0xYearnToken1',
        tokenBalance: '0xde0b6b3a7640000' // 1 token - IN Yearn list
      },
      {
        contractAddress: '0xUnknownToken',
        tokenBalance: '0x1bc16d674ec80000' // 2 tokens - NOT in Yearn list
      }
    ];

    it('should enrich Alchemy tokens with imported token data (Case B)', () => {
      const importedTokens: ImportedToken[] = [
        createImportedToken('0xUnknownToken', 'Imported Token', 'IMP', 18, '2000000000000000000')
      ];

      const result = tokenModule.buildTokens(mockTokenBalances, importedTokens, [], 1);

      // UnknownToken is NOT in Yearn, but IS imported, so it should appear with imported metadata
      const importedToken = result.find((t: TokenDto) => t.address.toLowerCase() === '0xunknowntoken');
      expect(importedToken).toBeDefined();
      expect(importedToken?.name).toBe('Imported Token');
      expect(importedToken?.symbol).toBe('IMP');
    });

    it('should add imported tokens not in Alchemy response (Case A)', () => {
      const importedTokens: ImportedToken[] = [
        createImportedToken('0xNotInAlchemy', 'Manual Token', 'MAN', 6, '1000000')
      ];

      const result = tokenModule.buildTokens(mockTokenBalances, importedTokens, [], 1);

      // Should include token not in Alchemy because it's imported
      const manualToken = result.find((t: TokenDto) => t.address.toLowerCase() === '0xnotinalchemy');
      expect(manualToken).toBeDefined();
      expect(manualToken?.name).toBe('Manual Token');
      expect(manualToken?.symbol).toBe('MAN');
      expect(manualToken?.decimals).toBe(6);
    });

    it('should filter out blacklisted addresses case-insensitively', () => {
      const importedTokens: ImportedToken[] = [];
      const blacklistedAddresses = ['0xYEARNTOKEN1']; // Different case

      const result = tokenModule.buildTokens(mockTokenBalances, importedTokens, blacklistedAddresses, 1);

      // Should not find blacklisted token
      const blacklistedToken = result.find((t: TokenDto) => t.address.toLowerCase() === '0xyearntoken1');
      expect(blacklistedToken).toBeUndefined();
    });

    it('should filter imported tokens with zero balance via dust filter', () => {
      const importedTokens: ImportedToken[] = [
        createImportedToken('0xZeroBalance', 'Zero Token', 'ZERO', 18, '0')
      ];

      const result = tokenModule.buildTokens([], importedTokens, [], 1);

      // Zero balance token should be filtered out by dust filter
      const zeroToken = result.find((t: TokenDto) => t.address.toLowerCase() === '0xzerobalance');
      expect(zeroToken).toBeUndefined();
    });

    it('should handle multiple imported tokens correctly', () => {
      const importedTokens: ImportedToken[] = [
        createImportedToken('0xToken1', 'Token One', 'TK1', 18, '1000000000000000000'),
        createImportedToken('0xToken2', 'Token Two', 'TK2', 6, '1000000'),
        createImportedToken('0xUnknownToken', 'Token Three', 'TK3', 9, '1000000000')
      ];

      const result = tokenModule.buildTokens(mockTokenBalances, importedTokens, [], 1);

      // Should have imported tokens (they bypass Yearn filter)
      const tk1 = result.find((t: TokenDto) => t.address.toLowerCase() === '0xtoken1');
      const tk2 = result.find((t: TokenDto) => t.address.toLowerCase() === '0xtoken2');
      const tk3 = result.find((t: TokenDto) => t.address.toLowerCase() === '0xunknowntoken');

      expect(tk1).toBeDefined();
      expect(tk2).toBeDefined();
      expect(tk3).toBeDefined();
      expect(tk3?.name).toBe('Token Three');
    });
  });

  describe('createImportedToken', () => {
    it('should create an ImportedToken with formatted balance', () => {
      const token = createImportedToken(
        '0xtoken',
        'Test Token',
        'TEST',
        18,
        '1000000000000000000'
      );

      expect(token).toMatchObject({
        address: '0xtoken',
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        balance: '1000000000000000000'
      });
      expect(token.balanceFormatted).toBe('1.0');
    });

    it('should handle different decimals correctly', () => {
      const token = createImportedToken(
        '0xusdc',
        'USD Coin',
        'USDC',
        6,
        '1000000'
      );

      expect(token.decimals).toBe(6);
      expect(token.balanceFormatted).toBe('1.0');
    });
  });

  describe('buildNativeToken', () => {
    it('should build native ETH token correctly for mainnet', () => {
      const nativeToken = tokenModule.buildNativeToken('0xde0b6b3a7640000', 1);

      expect(nativeToken).toMatchObject({
        address: 'native',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: '1000000000000000000',
        balanceFormatted: '1.000000'
      });
    });

    it('should build native ETH token correctly for Base', () => {
      const nativeToken = tokenModule.buildNativeToken('0x2386f26fc10000', 8453);

      expect(nativeToken).toMatchObject({
        address: 'native',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Alchemy response with imported tokens', () => {
      const importedTokens: ImportedToken[] = [
        createImportedToken('0xToken1', 'Token One', 'TK1', 18, '1000000000000000000')
      ];

      const result = tokenModule.buildTokens([], importedTokens, [], 1);

      // Should include imported token even with no Alchemy tokens
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Token One');
    });

    it('should handle case-insensitive address matching', () => {
      const mockTokenBalances = [
        {
          contractAddress: '0xAbCdEf123456',
          tokenBalance: '0xde0b6b3a7640000'
        }
      ];

      const importedTokens: ImportedToken[] = [
        createImportedToken('0xaBcDeF123456', 'Case Test', 'CASE', 18, '1000000000000000000')
      ];

      const result = tokenModule.buildTokens(mockTokenBalances, importedTokens, [], 1);

      // Should match case-insensitively and include imported token
      const token = result.find((t: TokenDto) => 
        t.address.toLowerCase() === '0xabcdef123456'
      );
      expect(token).toBeDefined();
      expect(token?.name).toBe('Case Test');
    });
  });
});
