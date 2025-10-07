import { Program, AnchorProvider, BN, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Import the latest IDL with new program address and authority
import IDL from './wagerfi-mainnet-idl.json';

// Type the IDL properly
export type WagerfiEscrow = typeof IDL;

// Program ID from the latest deployment
const PROGRAM_ID = new PublicKey(IDL.metadata?.address || '9CHCVvnFyM62QjwwEfkmuVfHkYNUbDx7BAaLksxHsLez');

export enum WinnerType {
    Creator = 'Creator',
    Acceptor = 'Acceptor',
}

export enum WagerStatus {
    Open = 'Open',
    Active = 'Active',
    Resolved = 'Resolved',
    Cancelled = 'Cancelled',
    Expired = 'Expired',
}

export interface WagerAccount {
    wagerId: string;
    creator: PublicKey;
    acceptor: PublicKey | null;
    amount: BN;
    status: WagerStatus;
    expiryTime: BN;
    createdAt: BN;
    acceptedAt: BN | null;
    resolvedAt: BN | null;
    winner: WinnerType | null;
    metadata: string;
}

export class AnchorEscrowClient {
    private program: Program<any>;
    private provider: AnchorProvider;

    constructor(connection: Connection, wallet?: { publicKey: PublicKey | null; signTransaction?: any; signAllTransactions?: any; sendTransaction?: any; }) {
        // Create a compatible wallet object for AnchorProvider
        const anchorWallet = wallet?.publicKey ? {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction || (async (_tx: any) => {
                console.log('Using sendTransaction fallback for signTransaction');
                if (wallet.sendTransaction) {
                    // For wallet adapters that only expose sendTransaction, we can't just sign
                    // We need to let Anchor handle it differently
                    throw new Error('Wallet only supports sendTransaction, not signTransaction');
                }
                throw new Error('signTransaction not available');
            }),
            signAllTransactions: wallet.signAllTransactions || (async (txs: any[]) => {
                console.log('Using fallback for signAllTransactions');
                if (wallet.signTransaction) {
                    // Sign each transaction individually
                    return Promise.all(txs.map(tx => wallet.signTransaction!(tx)));
                }
                throw new Error('signAllTransactions not available');
            }),
            sendTransaction: wallet.sendTransaction, // Store sendTransaction for later use
        } : undefined;

        // @ts-ignore - wallet adapter types
        this.provider = new AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' });
        this.program = new Program(IDL as any, PROGRAM_ID, this.provider);

        // Debug program ID matching
        console.log('🔍 Program ID Debug:', {
            clientProgramId: PROGRAM_ID.toString(),
            idlProgramId: IDL.metadata?.address,
            providerProgramId: this.program.programId.toString(),
            idsMatch: PROGRAM_ID.toString() === this.program.programId.toString()
        });
    }

    /**
     * Get PDA addresses for wager and escrow accounts
     */
    public getWagerPDA(wagerId: string): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from('wager'), Buffer.from(wagerId)],
            PROGRAM_ID
        );
    }

    public getEscrowPDA(wagerId: string): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from('escrow'), Buffer.from(wagerId)],
            PROGRAM_ID
        );
    }

    /**
     * Create a new wager
     */
    async createWager(
        wagerId: string,
        amount: number, // Amount in lamports
        expiryTime: number, // Unix timestamp
        metadata: string = "",
        sendTransaction?: any
    ) {
        if (!this.provider.wallet?.publicKey) {
            throw new Error('Wallet not connected');
        }

        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        console.log('🔧 Creating wager with parameters:', {
            wagerId,
            amount: amount / 1e9, // Convert lamports to SOL for logging
            expiryTime: new Date(expiryTime * 1000).toISOString(),
            metadata,
            wagerPDA: wagerPDA.toString(),
            escrowPDA: escrowPDA.toString(),
            creator: this.provider.wallet.publicKey.toString(),
            programId: PROGRAM_ID.toString()
        });

        // Validate parameters before creating transaction
        if (!wagerId || wagerId.length === 0) {
            throw new Error('Wager ID cannot be empty');
        }
        if (wagerId.length > 64) {
            throw new Error('Wager ID too long (max 64 characters)');
        }
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        if (metadata.length > 500) {
            throw new Error('Metadata too long (max 500 characters)');
        }
        if (expiryTime <= Math.floor(Date.now() / 1000)) {
            throw new Error('Expiry time must be in the future');
        }

        // Additional validation for wager ID format
        console.log('🔍 Wager ID validation:', {
            wagerId,
            length: wagerId.length,
            isValidLength: wagerId.length <= 64,
            containsInvalidChars: /[^a-zA-Z0-9\-]/.test(wagerId)
        });

        // Always use wallet adapter when available (required for Privy)
        if (sendTransaction) {
            try {
                console.log('🔧 Using wallet adapter sendTransaction...');

                // Use the correct account structure from the mainnet IDL
                console.log('🔍 Transaction Debug:', {
                    programId: this.program.programId.toString(),
                    wagerPDA: wagerPDA.toString(),
                    escrowPDA: escrowPDA.toString(),
                    creator: this.provider.wallet.publicKey.toString(),
                    systemProgram: web3.SystemProgram.programId.toString()
                });

                const transaction = await this.program.methods
                    .createWager(
                        wagerId,
                        new BN(amount),
                        new BN(expiryTime),
                        metadata
                    )
                    .accounts({
                        creator: this.provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                    })
                    .transaction();

                // Get the latest blockhash
                const { blockhash } = await this.provider.connection.getLatestBlockhash('confirmed');
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = this.provider.wallet.publicKey;

                console.log('🔧 Transaction prepared, sending via wallet adapter...');

                // Skip simulation for now to test if the issue is with simulation vs actual execution
                console.log('🔍 Skipping simulation to test actual execution...');

                const signature = await sendTransaction(transaction, this.provider.connection, {
                    skipPreflight: true, // Skip preflight to bypass simulation issues
                    preflightCommitment: 'confirmed',
                    maxRetries: 3
                });

                console.log('✅ Transaction sent successfully:', signature);

                // Get the actual PDAs that Anchor derived
                const [actualWagerPDA] = this.getWagerPDA(wagerId);
                const [actualEscrowPDA] = this.getEscrowPDA(wagerId);

                return {
                    signature,
                    wagerPDA: actualWagerPDA,
                    escrowPDA: actualEscrowPDA,
                };
            } catch (error) {
                console.error('❌ Error with wallet adapter sendTransaction:', error);
                console.error('❌ Error details:', {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    name: error instanceof Error ? error.name : 'Unknown'
                });

                // Provide more specific error messages
                if (error instanceof Error) {
                    if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
                        throw new Error('Transaction was cancelled by user');
                    } else if (error.message.includes('insufficient funds') || error.message.includes('0x1')) {
                        throw new Error('Insufficient SOL balance to create wager');
                    } else if (error.message.includes('not authorized') || error.message.includes('not been authorized')) {
                        throw new Error('Wallet transaction was rejected. Please approve the transaction in your wallet to create the wager.');
                    } else if (error.message.includes('Unexpected error')) {
                        throw new Error('Wallet connection error. Please try reconnecting your wallet and try again.');
                    } else if (error.message.includes('simulation')) {
                        throw new Error('Transaction simulation failed. This usually means the program rejected the transaction. Check your parameters and try again.');
                    } else if (error.message.includes('reverted')) {
                        throw new Error('Transaction was reverted during simulation. This usually means insufficient funds or invalid parameters.');
                    }
                }

                throw error;
            }
        }

        // No RPC fallback - wallet adapter is required for Privy
        throw new Error('Wallet adapter is required for transaction signing. Please ensure sendTransaction is provided.');
    }

    /**
     * Accept an existing wager
     */
    async acceptWager(wagerId: string, sendTransaction?: any) {
        if (!this.provider.wallet?.publicKey) {
            throw new Error('Wallet not connected');
        }

        // PDAs will be automatically derived by Anchor based on IDL

        // If we have sendTransaction from wallet adapter, use it instead of Anchor's rpc
        if (sendTransaction) {
            try {
                console.log('🔧 Accepting wager with wallet adapter sendTransaction...');

                // Get the PDAs first
                const [wagerPDA] = this.getWagerPDA(wagerId);
                const [escrowPDA] = this.getEscrowPDA(wagerId);

                const transaction = await this.program.methods
                    .acceptWager()
                    .accounts({
                        wager: wagerPDA,
                        escrow: escrowPDA,
                        acceptor: this.provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                    })
                    .transaction();

                // Get the latest blockhash
                const { blockhash } = await this.provider.connection.getLatestBlockhash('confirmed');
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = this.provider.wallet.publicKey;

                const signature = await sendTransaction(transaction, this.provider.connection, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    maxRetries: 3
                });

                return {
                    signature,
                    wagerPDA: wagerPDA,
                    escrowPDA: escrowPDA,
                };
            } catch (error) {
                console.error('❌ Error with wallet adapter sendTransaction for accept:', error);
                throw error;
            }
        }

        // Fallback to Anchor's rpc method
        // Get the PDAs first
        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        const tx = await this.program.methods
            .acceptWager()
            .accounts({
                wager: wagerPDA,
                escrow: escrowPDA,
                acceptor: this.provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        return {
            signature: tx,
            wagerPDA: wagerPDA,
            escrowPDA: escrowPDA,
        };
    }

    /**
     * Resolve a wager (authority only)
     */
    async resolveWager(
        wagerId: string,
        winner: WinnerType,
        winnerPubkey: PublicKey,
        authorityKeypair: Keypair
    ) {
        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        const tx = await this.program.methods
            .resolveWager({ [winner.toLowerCase()]: {} })
            .accounts({
                wager: wagerPDA,
                escrow: escrowPDA,
                winner: winnerPubkey,
                authority: authorityKeypair.publicKey,
            })
            .signers([authorityKeypair])
            .rpc();

        return {
            signature: tx,
            wagerPDA,
            escrowPDA,
        };
    }

    /**
     * Cancel a wager (authority only)
     */
    async cancelWager(
        wagerId: string,
        creatorPubkey: PublicKey,
        authorityKeypair: Keypair
    ) {
        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        const tx = await this.program.methods
            .cancelWager()
            .accounts({
                wager: wagerPDA,
                escrow: escrowPDA,
                creator: creatorPubkey,
                authority: authorityKeypair.publicKey,
            })
            .signers([authorityKeypair])
            .rpc();

        return {
            signature: tx,
            wagerPDA,
            escrowPDA,
        };
    }

    /**
     * Handle expired wager (authority only)
     */
    async handleExpiredWager(
        wagerId: string,
        creatorPubkey: PublicKey,
        authorityKeypair: Keypair
    ) {
        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        const tx = await this.program.methods
            .handleExpiredWager()
            .accounts({
                wager: wagerPDA,
                escrow: escrowPDA,
                creator: creatorPubkey,
                authority: authorityKeypair.publicKey,
            })
            .signers([authorityKeypair])
            .rpc();

        return {
            signature: tx,
            wagerPDA,
            escrowPDA,
        };
    }

    /**
     * Handle draw wager (authority only)
     */
    async handleDrawWager(
        wagerId: string,
        creatorPubkey: PublicKey,
        acceptorPubkey: PublicKey,
        authorityKeypair: Keypair
    ) {
        const [wagerPDA] = this.getWagerPDA(wagerId);
        const [escrowPDA] = this.getEscrowPDA(wagerId);

        const tx = await this.program.methods
            .handleDrawWager()
            .accounts({
                wager: wagerPDA,
                escrow: escrowPDA,
                creator: creatorPubkey,
                acceptor: acceptorPubkey,
                authority: authorityKeypair.publicKey,
            })
            .signers([authorityKeypair])
            .rpc();

        return {
            signature: tx,
            wagerPDA,
            escrowPDA,
        };
    }

    /**
     * Fetch wager account data
     */
    async getWager(wagerId: string): Promise<WagerAccount | null> {
        try {
            const [wagerPDA] = this.getWagerPDA(wagerId);
            const wager = await this.program.account.wager.fetch(wagerPDA);
            return wager as WagerAccount;
        } catch (error) {
            console.warn(`Wager ${wagerId} not found:`, error);
            return null;
        }
    }

    /**
     * Get escrow balance
     */
    async getEscrowBalance(wagerId: string): Promise<number> {
        try {
            const [escrowPDA] = this.getEscrowPDA(wagerId);
            const balance = await this.provider.connection.getBalance(escrowPDA);
            return balance;
        } catch (error) {
            console.warn(`Could not get escrow balance for ${wagerId}:`, error);
            return 0;
        }
    }

    /**
     * Get all wagers for a user
     */
    async getUserWagers(userPubkey: PublicKey): Promise<WagerAccount[]> {
        const wagers = await this.program.account.wager.all([
            {
                memcmp: {
                    offset: 8 + 68, // Skip discriminator + wagerId string
                    bytes: userPubkey.toBase58(),
                },
            },
        ]);

        return wagers.map(({ account }) => account as WagerAccount);
    }
}

export default AnchorEscrowClient;
