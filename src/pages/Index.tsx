
import { useEffect } from 'react';
import { useXRPL } from '@/hooks/useXRPL';
import { WalletImport } from '@/components/WalletImport';
import { WalletInfo } from '@/components/WalletInfo';
import { OfferForm } from '@/components/OfferForm';
import { OffersList } from '@/components/OffersList';
import { TrustlineForm } from '@/components/TrustlineForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Globe, TrendingUp, Shield } from 'lucide-react';

const Index = () => {
  const {
    wallet,
    isConnected,
    isLoading,
    offers,
    connectToXRPL,
    importWallet,
    createTrustline,
    createOffer,
    refreshBalance,
    fetchOrderBook,
  } = useXRPL();

  useEffect(() => {
    connectToXRPL();
  }, [connectToXRPL]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              XRPL DEX
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Trade on the XRP Ledger Decentralized Exchange
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-success/20 text-success" : "bg-muted/50"}
            >
              <Globe className="w-3 h-3 mr-1" />
              {isConnected ? 'Connected to Mainnet' : 'Connecting...'}
            </Badge>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="max-w-md mx-auto mb-8 bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="text-warning">Connecting to XRPL</CardTitle>
              <CardDescription>
                Please wait while we connect to the XRPL Mainnet...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={connectToXRPL} 
                disabled={isLoading}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isLoading ? 'Connecting...' : 'Retry Connection'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wallet Import */}
        {isConnected && !wallet && (
          <div className="flex justify-center mb-8">
            <WalletImport onImport={importWallet} isLoading={isLoading} />
          </div>
        )}

        {/* Main Dashboard */}
        {isConnected && wallet && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Wallet Info */}
            <div className="grid lg:grid-cols-2 gap-6">
              <WalletInfo 
                wallet={wallet} 
                onRefresh={refreshBalance}
                isLoading={isLoading}
              />
              <Card className="bg-gradient-card border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Offers</span>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {offers.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Network</span>
                    <Badge variant="secondary" className="bg-success/20 text-success">
                      Mainnet
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Interface */}
            <Tabs defaultValue="trade" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="trade" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trade</span>
                </TabsTrigger>
                <TabsTrigger value="trustline" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Trustlines</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trade" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <OfferForm 
                    onCreateOffer={createOffer}
                    onFetchPrice={fetchOrderBook}
                    isLoading={isLoading}
                  />
                  <OffersList offers={offers} />
                </div>
              </TabsContent>
              
              <TabsContent value="trustline" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <TrustlineForm 
                    onCreateTrustline={createTrustline}
                    isLoading={isLoading}
                  />
                  <Card className="bg-gradient-card border-border/50 shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">About Trustlines</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Trustlines allow you to hold tokens issued by other accounts on the XRPL. 
                        You must create a trustline before you can receive or trade a token.
                      </p>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Currency Code:</strong> The token's code, e.g. USD or SOLO (longer codes are hex-encoded automatically)
                        </div>
                        <div className="text-sm">
                          <strong>Issuer:</strong> The XRPL address that issues the token
                        </div>
                        <div className="text-sm">
                          <strong>Limit:</strong> Maximum amount you're willing to hold (default: 1B)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
