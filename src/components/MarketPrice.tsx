import { useState, useEffect, useCallback, useRef } from 'react';
import { isValidClassicAddress } from 'xrpl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketPrice as MarketPriceType } from '@/hooks/useXRPL';

interface MarketPriceProps {
  currency: string;
  issuer: string;
  onFetchPrice: (token: { currency: string; issuer: string }) => Promise<MarketPriceType | null>;
  isLoading?: boolean;
}

const FETCH_DEBOUNCE_MS = 500;

const formatPrice = (value: string | null) =>
  value === null ? '—' : parseFloat(value).toFixed(6);

export const MarketPrice = ({ currency, issuer, onFetchPrice, isLoading }: MarketPriceProps) => {
  const [price, setPrice] = useState<MarketPriceType | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const requestId = useRef(0);

  const trimmedCurrency = currency.trim();
  const trimmedIssuer = issuer.trim();
  const isReady = trimmedCurrency.length >= 3 && isValidClassicAddress(trimmedIssuer);

  const fetchCurrentPrice = useCallback(async () => {
    if (!isReady) return;

    // Ignore responses that arrive after a newer request was started.
    const id = ++requestId.current;
    try {
      setIsFetching(true);
      const priceData = await onFetchPrice({ currency: trimmedCurrency, issuer: trimmedIssuer });
      if (id === requestId.current) setPrice(priceData);
    } catch (error) {
      console.error('Failed to fetch price:', error);
    } finally {
      if (id === requestId.current) setIsFetching(false);
    }
  }, [isReady, onFetchPrice, trimmedCurrency, trimmedIssuer]);

  useEffect(() => {
    setPrice(null);
    if (!isReady) return;
    const timer = setTimeout(fetchCurrentPrice, FETCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isReady, fetchCurrentPrice]);

  if (!isReady) {
    return (
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Market Price
          </CardTitle>
          <CardDescription>
            Enter a currency code and a valid issuer address to see current market prices
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Market Price
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCurrentPrice}
            disabled={isFetching || isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          {trimmedCurrency}/XRP • Real-time XRPL DEX prices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {price ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Best Bid</span>
                </div>
                <div className="text-2xl font-bold text-success">
                  {formatPrice(price.bid)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  XRP per {trimmedCurrency}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Best Ask</span>
                </div>
                <div className="text-2xl font-bold text-destructive">
                  {formatPrice(price.ask)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  XRP per {trimmedCurrency}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Spread:</span>
                <span className="ml-2 font-medium">
                  {price.spread !== null && price.midPrice !== null
                    ? `${(parseFloat(price.spread) / parseFloat(price.midPrice) * 100).toFixed(2)}%`
                    : '—'}
                </span>
              </div>
              {price.midPrice !== null && (
                <div>
                  <span className="text-muted-foreground">Mid Price:</span>
                  <span className="ml-2 font-medium">{formatPrice(price.midPrice)}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isFetching ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Fetching prices...</span>
              </div>
            ) : (
              <div>
                <p>No market data available</p>
                <p className="text-xs mt-1">This trading pair may not have active offers</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};