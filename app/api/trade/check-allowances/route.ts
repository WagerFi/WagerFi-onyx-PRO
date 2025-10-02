import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Polymarket Exchange contract address
const EXCHANGE_CONTRACT = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

// USDC contract on Polygon
const USDC_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

// CTF Exchange contract
const CTF_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';

const ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'address parameter is required' },
                { status: 400 }
            );
        }

        // Connect to Polygon
        const provider = new ethers.providers.JsonRpcProvider(
            'https://polygon-rpc.com'
        );

        // Check USDC allowance and balance
        const usdcContract = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, provider);
        const usdcAllowance = await usdcContract.allowance(address, EXCHANGE_CONTRACT);
        const usdcBalance = await usdcContract.balanceOf(address);

        console.log('💰 Allowances checked:', {
            address,
            usdcAllowance: ethers.utils.formatUnits(usdcAllowance, 6),
            usdcBalance: ethers.utils.formatUnits(usdcBalance, 6),
        });

        return NextResponse.json({
            success: true,
            address,
            usdc: {
                balance: ethers.utils.formatUnits(usdcBalance, 6),
                allowance: ethers.utils.formatUnits(usdcAllowance, 6),
                hasAllowance: usdcAllowance.gt(0),
            },
        });
    } catch (error: any) {
        console.error('❌ Error checking allowances:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check allowances', details: error.message },
            { status: 500 }
        );
    }
}

