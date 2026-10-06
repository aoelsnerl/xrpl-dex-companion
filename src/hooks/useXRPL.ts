import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Client,
  Wallet,
  dropsToXrp,
  xrpToDrops,
  AccountOffer,
  Amount,
  BookOffer,
  BookOfferCurrency,
  SubmittableTransaction,
  TransactionMetadata,
} from 'xrpl';
import { toast } from '@/hooks/use-toast';
import { TokenInput, encodeCurrency, errorMessage, rippledErrorCode, toTokenAmount } from '@/lib/xrpl';

export interface XRPLWallet {
  address: string;
  balance: string;
  activated: boolean;
}

export interface OfferData {
  account: string;
  sequence: number;
  takerGets: Amount;
  takerPays: Amount;
  flags?: number;
}

export interface OrderBookEntry {
  price: string;
  amount: string;
}

/** Prices are quoted in XRP per token. */
export interface MarketPrice {
  bid: string | null;
  ask: string | null;
  spread: string | null;
  midPrice: string | null;
}

export type OfferSide = 'buy' | 'sell';

export interface CreateOfferParams {
  /** "buy" buys the token with XRP, "sell" sells the token for XRP. */
  side: OfferSide;
  xrpAmount: string;
  token: TokenInput & { value: string };
}

const XRPL_SERVER = 'wss://xrplcluster.com'; // Mainnet

const fetchBalance = async (client: Client, address: string) => {
  try {
    const accountInfo = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });
    return {
      balance: dropsToXrp(accountInfo.result.account_data.Balance).toString(),
      activated: true,
    };
  } catch (error) {
    if (rippledErrorCode(error) === 'actNotFound') {
      return { balance: '0', activated: false };
    }
    throw error;
  }
};

/** XRP per token for a book offer, or null if the offer isn't an XRP/token pair. */
const offerPrice = (offer: BookOffer): number | null => {
  const { TakerGets, TakerPays } = offer;
  if (typeof TakerGets === 'string' && typeof TakerPays === 'object') {
    return Number(dropsToXrp(TakerGets)) / parseFloat(TakerPays.value);
  }
  if (typeof TakerGets === 'object' && typeof TakerPays === 'string') {
    return Number(dropsToXrp(TakerPays)) / parseFloat(TakerGets.value);
  }
  return null;
};

export const useXRPL = () => {
  const clientRef = useRef<Client | null>(null);
  const signerRef = useRef<Wallet | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState<OfferData[]>([]);

  const connectToXRPL = useCallback(async () => {
    const previous = clientRef.current;
    const xrplClient = new Client(XRPL_SERVER);
    clientRef.current = xrplClient;
    if (previous) {
      previous.disconnect().catch(() => undefined);
    }

    xrplClient.on('connected', () => {
      if (clientRef.current === xrplClient) setIsConnected(true);
    });
    xrplClient.on('disconnected', () => {
      if (clientRef.current === xrplClient) setIsConnected(false);
    });

    try {
      setIsLoading(true);
      await xrplClient.connect();
      if (clientRef.current !== xrplClient) return;
      setClient(xrplClient);
      setIsConnected(true);
      toast({
        title: "Connected to XRPL",
        description: "Successfully connected to XRPL Mainnet",
      });
    } catch (error) {
      if (clientRef.current !== xrplClient) return;
      console.error('Failed to connect to XRPL:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to XRPL network",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close the websocket when the component using this hook unmounts.
  useEffect(() => () => {
    const current = clientRef.current;
    clientRef.current = null;
    current?.disconnect().catch(() => undefined);
  }, []);

  const submitTransaction = useCallback(async (tx: SubmittableTransaction) => {
    const signer = signerRef.current;
    if (!client || !signer) {
      throw new Error('Wallet not connected');
    }

    const prepared = await client.autofill(tx);
    const signed = signer.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta as TransactionMetadata | undefined;
    const code = meta?.TransactionResult;
    if (code !== 'tesSUCCESS') {
      throw new Error(`Transaction failed: ${code ?? 'unknown result'}`);
    }
    return result;
  }, [client]);

  const importWallet = useCallback(async (seed: string): Promise<void> => {
    try {
      setIsLoading(true);

      if (!client) {
        throw new Error('Not connected to XRPL');
      }

      // The seed encodes its own key algorithm (secp256k1 or ed25519), so let
      // xrpl.js pick it; forcing an algorithm derives a different account.
      let xrplWallet: Wallet;
      try {
        xrplWallet = Wallet.fromSeed(seed);
      } catch {
        throw new Error('Invalid seed. Expected a family seed starting with "s".');
      }

      const { balance, activated } = await fetchBalance(client, xrplWallet.address);

      signerRef.current = xrplWallet;
      setWallet({ address: xrplWallet.address, balance, activated });

      if (activated) {
        toast({
          title: "Wallet Imported",
          description: `Successfully imported wallet: ${xrplWallet.address}`,
        });
      } else {
        toast({
          title: "Account Not Activated",
          description: `${xrplWallet.address} has not been funded yet. Send it XRP to cover the base reserve before trading.`,
        });
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      toast({
        title: "Import Failed",
        description: errorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const fetchOffers = useCallback(async () => {
    try {
      if (!client || !wallet) return;

      const response = await client.request({
        command: 'account_offers',
        account: wallet.address,
      });

      const mappedOffers: OfferData[] = (response.result.offers || []).map((offer: AccountOffer) => ({
        account: wallet.address,
        sequence: offer.seq,
        takerGets: offer.taker_gets,
        takerPays: offer.taker_pays,
        flags: offer.flags
      }));
      setOffers(mappedOffers);
    } catch (error) {
      if (rippledErrorCode(error) === 'actNotFound') {
        setOffers([]);
        return;
      }
      console.error('Failed to fetch offers:', error);
    }
  }, [client, wallet]);

  const refreshBalance = useCallback(async () => {
    try {
      if (!client || !wallet) return;

      const { balance, activated } = await fetchBalance(client, wallet.address);
      setWallet(prev => prev ? { ...prev, balance, activated } : null);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [client, wallet]);

  const createTrustline = useCallback(async (
    currency: string,
    issuer: string,
    limit: string = '1000000000'
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const signer = signerRef.current;
      if (!signer) {
        throw new Error('Wallet not connected');
      }

      await submitTransaction({
        TransactionType: 'TrustSet',
        Account: signer.address,
        LimitAmount: toTokenAmount({ currency, issuer, value: limit || '1000000000' }),
      });

      toast({
        title: "Trustline Created",
        description: `Successfully created trustline for ${currency.trim()}`,
      });
      await refreshBalance();
    } catch (error) {
      console.error('Failed to create trustline:', error);
      toast({
        title: "Trustline Failed",
        description: errorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [submitTransaction, refreshBalance]);

  const createOffer = useCallback(async ({ side, xrpAmount, token }: CreateOfferParams): Promise<void> => {
    try {
      setIsLoading(true);
      const signer = signerRef.current;
      if (!signer) {
        throw new Error('Wallet not connected');
      }

      // TakerGets is what this account gives up; TakerPays is what it receives.
      const xrp = xrpToDrops(xrpAmount);
      const tokenAmount = toTokenAmount(token);

      await submitTransaction({
        TransactionType: 'OfferCreate',
        Account: signer.address,
        TakerGets: side === 'buy' ? xrp : tokenAmount,
        TakerPays: side === 'buy' ? tokenAmount : xrp,
      });

      toast({
        title: "Offer Created",
        description: `Successfully created ${side} offer`,
      });
      await Promise.all([fetchOffers(), refreshBalance()]);
    } catch (error) {
      console.error('Failed to create offer:', error);
      toast({
        title: "Offer Failed",
        description: errorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [submitTransaction, fetchOffers, refreshBalance]);

  /** Fetches the best bid and ask for a token, quoted in XRP per token. */
  const fetchOrderBook = useCallback(async (
    token: { currency: string; issuer: string }
  ): Promise<MarketPrice | null> => {
    try {
      if (!client) return null;

      const tokenCurrency: BookOfferCurrency = {
        currency: encodeCurrency(token.currency),
        issuer: token.issuer.trim(),
      };
      const xrpCurrency: BookOfferCurrency = { currency: 'XRP' };

      const [asks, bids] = await Promise.all([
        // Offers selling the token for XRP, cheapest first.
        client.request({
          command: 'book_offers',
          taker_gets: tokenCurrency,
          taker_pays: xrpCurrency,
          limit: 10,
        }),
        // Offers buying the token with XRP, highest price first.
        client.request({
          command: 'book_offers',
          taker_gets: xrpCurrency,
          taker_pays: tokenCurrency,
          limit: 10,
        }),
      ]);

      const bestAsk = asks.result.offers.length > 0 ? offerPrice(asks.result.offers[0]) : null;
      const bestBid = bids.result.offers.length > 0 ? offerPrice(bids.result.offers[0]) : null;

      if (bestAsk === null && bestBid === null) {
        return null;
      }

      const both = bestAsk !== null && bestBid !== null;
      return {
        bid: bestBid !== null ? bestBid.toString() : null,
        ask: bestAsk !== null ? bestAsk.toString() : null,
        spread: both ? (bestAsk - bestBid).toString() : null,
        midPrice: both ? ((bestAsk + bestBid) / 2).toString() : null,
      };
    } catch (error) {
      console.error('Failed to fetch order book:', error);
      return null;
    }
  }, [client]);

  useEffect(() => {
    if (wallet && client) {
      fetchOffers();
    }
  }, [wallet, client, fetchOffers]);

  return {
    client,
    wallet,
    isConnected,
    isLoading,
    offers,
    connectToXRPL,
    importWallet,
    createTrustline,
    createOffer,
    fetchOffers,
    refreshBalance,
    fetchOrderBook,
  };
};
