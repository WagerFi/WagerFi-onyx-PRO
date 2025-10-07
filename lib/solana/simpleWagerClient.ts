import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';

// Anchor escrow program ID (deployed via Solana Playground)
const WAGER_PROGRAM_ID = new PublicKey('9CHCVvnFyM62QjwwEfkmuVfHkYNUbDx7BAaLksxHsLez');

/**
 * Helper functions for PDA generation (must match the Rust implementation)
 */
export function getWagerPDA(wagerId: string) {
    const seed = wagerId.length > 32 ? Buffer.from(wagerId, 'utf8').slice(0, 32) : Buffer.from(wagerId, 'utf8');
    const [wagerPDA, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('wager'), seed],
        WAGER_PROGRAM_ID
    );
    return { pda: wagerPDA, bump };
}

export function getEscrowWalletPDA(wagerId: string) {
    const seed = wagerId.length > 32 ? Buffer.from(wagerId, 'utf8').slice(0, 32) : Buffer.from(wagerId, 'utf8');
    const [escrowWalletPDA, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), seed],
        WAGER_PROGRAM_ID
    );
    return { pda: escrowWalletPDA, bump };
}

/**
 * Create instruction to create a new wager
 */
export async function createCreateWagerInstruction(
    creator: PublicKey,
    wagerId: string,
    amountLamports: bigint,
    expiryTimestampSecs: bigint,
    metadata: string,
): Promise<TransactionInstruction> {
    const { pda: wagerPDA } = getWagerPDA(wagerId);
    const { pda: escrowWalletPDA } = getEscrowWalletPDA(wagerId);

    // Account order MUST match Rust process_create_wager function:
    // creator, wager, escrow_wallet, system_program, rent, clock
    const keys = [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: wagerPDA, isSigner: false, isWritable: true },
        { pubkey: escrowWalletPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ];

    // Manual Borsh-compatible serialization to match Rust CreateWagerData struct
    // This needs to match the exact format that Rust borsh::BorshDeserialize expects

    const encodeBorshString = (str: string): Buffer => {
        const utf8 = Buffer.from(str, 'utf8');
        const len = Buffer.alloc(4);
        len.writeUInt32LE(utf8.length, 0);  // Borsh uses little-endian u32 length prefix
        return Buffer.concat([len, utf8]);
    };

    const encodeBorshU64 = (value: bigint): Buffer => {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(value, 0);  // Borsh uses little-endian u64
        return buf;
    };

    const encodeBorshI64 = (value: bigint): Buffer => {
        const buf = Buffer.alloc(8);
        buf.writeBigInt64LE(value, 0);  // Borsh uses little-endian i64
        return buf;
    };

    // Serialize CreateWagerData struct in Borsh format
    const wagerIdBuf = encodeBorshString(wagerId);
    const amountBuf = encodeBorshU64(amountLamports);
    const expiryBuf = encodeBorshI64(expiryTimestampSecs);
    const metadataBuf = encodeBorshString(metadata);

    const serializedData = Buffer.concat([
        wagerIdBuf,
        amountBuf,
        expiryBuf,
        metadataBuf
    ]);

    // Add instruction tag (0 = CreateWager)
    const tag = Buffer.from([0]);
    const instructionData = Buffer.concat([tag, serializedData]);

    return new TransactionInstruction({
        keys,
        programId: WAGER_PROGRAM_ID,
        data: instructionData,
    });
}

/**
 * Create a wager on-chain (simplified version)
 */
export async function createWager(
    connection: Connection,
    creator: PublicKey,
    sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>,
    wagerId: string,
    amountSol: number,
    expiryTimestamp: number,
    metadata: string,
): Promise<{ success: boolean; signature?: string; wagerPDA?: string; escrowWallet?: string; error?: string }> {
    try {
        console.log(`🔄 Creating simple wager: ${wagerId} for ${amountSol} SOL`);

        const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));

        // Create the wager instruction
        const instruction = await createCreateWagerInstruction(
            creator,
            wagerId,
            amountLamports,
            BigInt(expiryTimestamp),
            metadata,
        );

        const transaction = new Transaction().add(instruction);

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = creator;

        // Simulate transaction first
        console.log(`🔄 Simulating simple wager creation...`);
        try {
            const simulation = await connection.simulateTransaction(transaction);
            if (simulation.value.err) {
                console.error('❌ CreateWager simulation failed:', simulation.value.err);
                throw new Error(`CreateWager simulation failed: ${JSON.stringify(simulation.value.err)}`);
            }
            console.log('✅ CreateWager simulation successful');
        } catch (simError) {
            console.error('❌ CreateWager simulation error:', simError);
            throw new Error(`CreateWager simulation failed: ${simError instanceof Error ? simError.message : 'Unknown error'}`);
        }

        console.log(`🔄 Sending createWager transaction to wallet for approval...`);
        const signature = await sendTransaction(transaction, connection);

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

        const { pda: wagerPDA } = getWagerPDA(wagerId);
        const { pda: escrowWalletPDA } = getEscrowWalletPDA(wagerId);

        console.log(`✅ Simple wager ${wagerId} created successfully`);
        console.log(`📍 Wager PDA: ${wagerPDA.toString()}`);
        console.log(`💰 Escrow Wallet: ${escrowWalletPDA.toString()}`);
        console.log(`🔗 Transaction: ${signature}`);

        return {
            success: true,
            signature,
            wagerPDA: wagerPDA.toString(),
            escrowWallet: escrowWalletPDA.toString()
        };

    } catch (error) {
        console.error(`❌ Failed to create simple wager ${wagerId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

