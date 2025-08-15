import { useState, useCallback, useEffect } from 'react';
import { Client, Wallet, dropsToXrp, xrpToDrops, AccountOffer, ECDSA } from 'xrpl';
import { toast } from '@/hooks/use-toast';

export interface XRPLWallet {
  address: string;
  balance: string;
  seed?: string;
}

export interface OfferData {
  account: string;
  sequence: number;
  takerGets: string | object;
  takerPays: string | object;
  flags?: number;
}

export interface OrderBookEntry {
  price: string;
  amount: string;
}

export interface MarketPrice {
  bid: string;
  ask: string;
  spread: string;
  lastPrice?: string;
}

export const useXRPL = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState<OfferData[]>([]);

  const connectToXRPL = useCallback(async () => {
    try {
      setIsLoading(true);
      const xrplClient = new Client('wss://xrplcluster.com'); // Mainnet
      await xrplClient.connect();
      setClient(xrplClient);
      setIsConnected(true);
      toast({
        title: "Connected to XRPL",
        description: "Successfully connected to XRPL Mainnet",
      });
    } catch (error) {
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

  const importWallet = useCallback(async (seed: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Try to import wallet with secp256k1 algorithm first, then fallback to ed25519
      let xrplWallet: Wallet;
      try {
        xrplWallet = Wallet.fromSeed(seed, { algorithm: ECDSA.secp256k1 });
      } catch (secp256k1Error) {
        try {
          xrplWallet = Wallet.fromSeed(seed, { algorithm: ECDSA.ed25519 });
        } catch (ed25519Error) {
          // If both fail, try without specifying algorithm (default behavior)
          xrplWallet = Wallet.fromSeed(seed);
        }
      }
      
      if (!client) {
        throw new Error('Not connected to XRPL');
      }

      // Get account info and balance
      const accountInfo = await client.request({
        command: 'account_info',
        account: xrplWallet.address,
      });

      const balance = dropsToXrp(accountInfo.result.account_data.Balance);
      
      setWallet({
        address: xrplWallet.address,
        balance: balance.toString(),
        seed,
      });

      toast({
        title: "Wallet Imported",
        description: `Successfully imported wallet: ${xrplWallet.address}`,
      });
    } catch (error) {
      console.error('Failed to import wallet:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import wallet. Check your seed phrase.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const createOffer = useCallback(async (
    takerGets: string,
    takerPays: string,
    isSellOffer: boolean = false
  ): Promise<void> => {
    try {
      if (!client || !wallet?.seed) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      const xrplWallet = Wallet.fromSeed(wallet.seed);

      const offerTx: any = {
        TransactionType: 'OfferCreate',
        Account: xrplWallet.address,
        TakerGets: isSellOffer ? xrpToDrops(takerGets) : takerGets,
        TakerPays: isSellOffer ? takerPays : xrpToDrops(takerPays),
      };

      const prepared = await client.autofill(offerTx);
      const signed = xrplWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if ((result.result.meta as any)?.TransactionResult === 'tesSUCCESS') {
        toast({
          title: "Offer Created",
          description: `Successfully created ${isSellOffer ? 'sell' : 'buy'} offer`,
        });
        await fetchOffers();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
      toast({
        title: "Offer Failed",
        description: "Failed to create offer",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, wallet]);

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
      console.error('Failed to fetch offers:', error);
    }
  }, [client, wallet]);

  const refreshBalance = useCallback(async () => {
    try {
      if (!client || !wallet) return;

      const accountInfo = await client.request({
        command: 'account_info',
        account: wallet.address,
      });

      const balance = dropsToXrp(accountInfo.result.account_data.Balance);
      setWallet(prev => prev ? { ...prev, balance: balance.toString() } : null);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [client, wallet]);

  const fetchOrderBook = useCallback(async (
    takerGets: { currency: string; issuer?: string },
    takerPays: { currency: string; issuer?: string }
  ): Promise<MarketPrice | null> => {
    try {
      if (!client) return null;

      const orderBookRequest = {
        command: 'book_offers',
        taker_gets: takerGets.currency === 'XRP' ? 'XRP' : {
          currency: takerGets.currency,
          issuer: takerGets.issuer
        },
        taker_pays: takerPays.currency === 'XRP' ? 'XRP' : {
          currency: takerPays.currency,
          issuer: takerPays.issuer
        },
        limit: 10
      };

      const response = await client.request(orderBookRequest as any);
      const bookOffers = (response.result as any).offers || [];

      if (bookOffers.length === 0) {
        return null;
      }

      // Calculate best bid (highest price someone is willing to pay)
      const bestOffer = bookOffers[0];
      let price = '0';
      
      if (typeof bestOffer.TakerGets === 'string' && typeof bestOffer.TakerPays === 'object') {
        // XRP/Token pair
        const xrpAmount = parseFloat(dropsToXrp(bestOffer.TakerGets).toString());
        const tokenAmount = parseFloat(bestOffer.TakerPays.value);
        price = (tokenAmount / xrpAmount).toFixed(6);
      } else if (typeof bestOffer.TakerGets === 'object' && typeof bestOffer.TakerPays === 'string') {
        // Token/XRP pair
        const tokenAmount = parseFloat(bestOffer.TakerGets.value);
        const xrpAmount = parseFloat(dropsToXrp(bestOffer.TakerPays).toString());
        price = (xrpAmount / tokenAmount).toFixed(6);
      }

      // For now, return the same price for bid and ask (in real implementation, you'd fetch both sides)
      return {
        bid: price,
        ask: price,
        spread: '0',
        lastPrice: price
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
    createOffer,
    fetchOffers,
    refreshBalance,
    fetchOrderBook,
  };
};