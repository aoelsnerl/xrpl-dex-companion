import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketPrice } from '@/components/MarketPrice';
import { MarketPrice as MarketPriceType } from '@/hooks/useXRPL';

interface OfferFormProps {
  onCreateOffer: (takerGets: string, takerPays: string, isSellOffer: boolean) => Promise<void>;
  onFetchPrice: (
    takerGets: { currency: string; issuer?: string },
    takerPays: { currency: string; issuer?: string }
  ) => Promise<MarketPriceType | null>;
  isLoading: boolean;
}

export const OfferForm = ({ onCreateOffer, onFetchPrice, isLoading }: OfferFormProps) => {
  const [buyForm, setBuyForm] = useState({
    xrpAmount: '',
    currency: '',
    issuer: '',
    amount: ''
  });
  
  const [sellForm, setSellForm] = useState({
    xrpAmount: '',
    currency: '',
    issuer: '',
    amount: ''
  });

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buyForm.xrpAmount && buyForm.currency && buyForm.issuer && buyForm.amount) {
      const takerGets = {
        currency: buyForm.currency,
        issuer: buyForm.issuer,
        value: buyForm.amount
      };
      await onCreateOffer(JSON.stringify(takerGets), buyForm.xrpAmount, false);
      setBuyForm({ xrpAmount: '', currency: '', issuer: '', amount: '' });
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellForm.xrpAmount && sellForm.currency && sellForm.issuer && sellForm.amount) {
      const takerPays = {
        currency: sellForm.currency,
        issuer: sellForm.issuer,
        value: sellForm.amount
      };
      await onCreateOffer(sellForm.xrpAmount, JSON.stringify(takerPays), true);
      setSellForm({ xrpAmount: '', currency: '', issuer: '', amount: '' });
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">Create DEX Offer</CardTitle>
        <CardDescription>
          Create buy or sell offers on the XRPL Decentralized Exchange
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Price Display */}
        <MarketPrice
          currency={buyForm.currency || sellForm.currency}
          issuer={buyForm.issuer || sellForm.issuer}
          onFetchPrice={onFetchPrice}
          isLoading={isLoading}
        />
        
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="buy" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Buy</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4" />
              <span>Sell</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4 mt-4">
            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buy-xrp">XRP Amount</Label>
                  <Input
                    id="buy-xrp"
                    type="number"
                    step="0.000001"
                    placeholder="100"
                    value={buyForm.xrpAmount}
                    onChange={(e) => setBuyForm(prev => ({ ...prev, xrpAmount: e.target.value }))}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buy-amount">Currency Amount</Label>
                  <Input
                    id="buy-amount"
                    type="number"
                    step="0.000001"
                    placeholder="1000"
                    value={buyForm.amount}
                    onChange={(e) => setBuyForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buy-currency">Currency Code</Label>
                <Input
                  id="buy-currency"
                  placeholder="USD"
                  value={buyForm.currency}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buy-issuer">Issuer Address</Label>
                <Input
                  id="buy-issuer"
                  placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={buyForm.issuer}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, issuer: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-success hover:bg-success/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Buy Offer'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sell-xrp">XRP Amount</Label>
                  <Input
                    id="sell-xrp"
                    type="number"
                    step="0.000001"
                    placeholder="100"
                    value={sellForm.xrpAmount}
                    onChange={(e) => setSellForm(prev => ({ ...prev, xrpAmount: e.target.value }))}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell-amount">Currency Amount</Label>
                  <Input
                    id="sell-amount"
                    type="number"
                    step="0.000001"
                    placeholder="1000"
                    value={sellForm.amount}
                    onChange={(e) => setSellForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sell-currency">Currency Code</Label>
                <Input
                  id="sell-currency"
                  placeholder="USD"
                  value={sellForm.currency}
                  onChange={(e) => setSellForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sell-issuer">Issuer Address</Label>
                <Input
                  id="sell-issuer"
                  placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={sellForm.issuer}
                  onChange={(e) => setSellForm(prev => ({ ...prev, issuer: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Sell Offer'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};