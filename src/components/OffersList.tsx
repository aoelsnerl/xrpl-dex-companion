import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Amount, dropsToXrp } from 'xrpl';
import { OfferData } from '@/hooks/useXRPL';
import { decodeCurrency } from '@/lib/xrpl';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OffersListProps {
  offers: OfferData[];
}

export const OffersList = ({ offers }: OffersListProps) => {
  const formatCurrency = (amount: Amount) => {
    if (typeof amount === 'string') {
      return `${dropsToXrp(amount)} XRP`;
    }
    return `${amount.value} ${decodeCurrency(amount.currency)}`;
  };

  const getOfferType = (offer: OfferData) => {
    // TakerGets is what the offer owner gives up. Giving XRP means buying the token;
    // giving the token means selling it for XRP.
    return typeof offer.takerGets === 'string' ? 'buy' : 'sell';
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <span>Active Offers</span>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {offers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active offers found</p>
            <p className="text-sm mt-1">Create your first DEX offer above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer, index) => {
              const type = getOfferType(offer);
              return (
                <div
                  key={`${offer.sequence}-${index}`}
                  className="p-4 bg-muted/20 rounded-lg border border-border/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {type === 'buy' ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                      <Badge
                        variant={type === 'buy' ? 'default' : 'destructive'}
                        className={type === 'buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
                      >
                        {type.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Seq: {offer.sequence}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Offering:</label>
                      <p className="font-medium">{formatCurrency(offer.takerGets)}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">For:</label>
                      <p className="font-medium">{formatCurrency(offer.takerPays)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};