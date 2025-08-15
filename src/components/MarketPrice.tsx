import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketPrice as MarketPriceType } from '@/hooks/useXRPL';

interface MarketPriceProps {
  currency: string;
  issuer: string;
  onFetchPrice: (
    takerGets: { currency: string; issuer?: string },
    takerPays: { currency: string; issuer?: string }
  ) => Promise<MarketPriceType | null>;
  isLoading?: boolean;
}

export const MarketPrice = ({ currency, issuer, onFetchPrice, isLoading }: MarketPriceProps) => {
  const [price, setPrice] = useState<MarketPriceType | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchCurrentPrice = async () => {
    if (!currency || !issuer) return;
    
    try {
      setIsFetching(true);
      
      // Fetch XRP/Token price
      const priceData = await onFetchPrice(
        { currency: 'XRP' },
        { currency, issuer }
      );
      
      setPrice(priceData);
    } catch (error) {
      console.error('Failed to fetch price:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (currency && issuer) {
      fetchCurrentPrice();
    }
  }, [currency, issuer]);

  if (!currency || !issuer) {
    return (
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Market Price
          </CardTitle>
          <CardDescription>
            Enter currency and issuer to see current market prices
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
          {currency}/XRP • Real-time XRPL DEX prices
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
                  {parseFloat(price.bid).toFixed(6)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  XRP per {currency}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Best Ask</span>
                </div>
                <div className="text-2xl font-bold text-destructive">
                  {parseFloat(price.ask).toFixed(6)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  XRP per {currency}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Spread:</span>
                <span className="ml-2 font-medium">
                  {((parseFloat(price.ask) - parseFloat(price.bid)) / parseFloat(price.bid) * 100).toFixed(2)}%
                </span>
              </div>
              {price.lastPrice && (
                <div>
                  <span className="text-muted-foreground">Last Price:</span>
                  <span className="ml-2 font-medium">{parseFloat(price.lastPrice).toFixed(6)}</span>
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