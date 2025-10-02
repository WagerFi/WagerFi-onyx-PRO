// Polymarket Type Definitions

export interface Market {
    // ID fields (API uses different naming conventions)
    id?: string;
    condition_id?: string;
    conditionId?: string;  // camelCase from API
    question_id?: string;
    slug?: string;

    // Market details
    question: string;
    description?: string;
    end_date_iso?: string;
    game_start_time?: string;
    category?: string;
    tags?: string[];
    image?: string;
    icon?: string;
    active?: boolean;
    closed?: boolean;
    accepting_orders?: boolean;
    tokens?: Token[];
    volume?: string;
    volume_24hr?: string;
    volume24hr?: string;
    liquidity?: string;
    outcomes: string[] | string;
    outcome_prices?: string[] | string;
    outcomePrices?: string[] | string;
    clobTokenIds?: string[] | string;
    rewards?: Reward[];
    markets?: SubMarket[];
    // Event context
    event_slug?: string;
    event_title?: string;
    // Derived fields
    profitability_score?: number;
    trend_score?: number;
}

export interface SubMarket {
    clob_token_ids: string[];
    condition_id: string;
    description: string;
    end_date_iso: string;
    game_start_time: string;
    market_slug: string;
    question: string;
    question_id: string;
    tokens: Token[];
}

export interface Token {
    token_id: string;
    outcome: string;
    price: string;
    winner: boolean;
}

export interface Reward {
    id: string;
    event_id: string;
    reward_epoch: number;
    type: string;
}

export interface OrderBookSummary {
    market: string;
    asset_id: string;
    hash: string;
    bids: BookLevel[];
    asks: BookLevel[];
    timestamp: number;
}

export interface BookLevel {
    price: string;
    size: string;
}

export interface Trade {
    id: string;
    market: string;
    asset_id: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    timestamp: number;
    trader_address?: string;
}

export interface Order {
    order_id: string;
    market: string;
    asset_id: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    status: 'LIVE' | 'MATCHED' | 'CANCELED';
    created_at: number;
    owner: string;
}

export interface CreateOrderOptions {
    tokenID: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
    feeRateBps?: number;
    nonce?: number;
    expiration?: number;
}

export interface SignedOrder {
    salt: string;
    maker: string;
    signer: string;
    taker: string;
    tokenId: string;
    makerAmount: string;
    takerAmount: string;
    side: string;
    expiration: string;
    nonce: string;
    feeRateBps: string;
    signatureType: number;
    signature: string;
}

export interface TickSize {
    token_id: string;
    minimum_tick_size: number;
    minimum_order_size: number;
}

export interface PriceHistory {
    t: number; // timestamp
    p: string; // price
    v?: string; // volume
}

export interface WebSocketMessage {
    event_type: 'market' | 'book' | 'last_trade_price' | 'tick_size' | 'user';
    market?: string;
    asset_id?: string;
    hash?: string;
    price?: string;
    timestamp?: number;
    data?: any;
}

export interface MarketFilters {
    category?: string;
    active?: boolean;
    closed?: boolean;
    sortBy?: 'volume' | 'liquidity' | 'profitability' | 'trending';
    limit?: number;
    offset?: number;
}

export interface BatchOrderRequest {
    orders: CreateOrderOptions[];
}

export interface UserPosition {
    asset_id: string;
    market: string;
    token_id: string;
    outcome: string;
    size: string;
    average_price: string;
    current_price: string;
    pnl: string;
    pnl_percentage: string;
}

