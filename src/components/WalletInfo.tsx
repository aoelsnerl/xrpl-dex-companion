import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Wallet } from 'lucide-react';
import { XRPLWallet } from '@/hooks/useXRPL';
import { toast } from '@/hooks/use-toast';

interface WalletInfoProps {
  wallet: XRPLWallet;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export const WalletInfo = ({ wallet, onRefresh, isLoading }: WalletInfoProps) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Wallet Info</CardTitle>
        </div>
        <Badge variant="secondary" className="bg-success/20 text-success">
          Connected
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Address
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-muted/50 px-3 py-2 rounded text-sm font-mono border border-border/30">
              {wallet.address}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              className="border-border/50"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Balance
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="bg-muted/50 px-3 py-2 rounded border border-border/30">
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {wallet.balance} XRP
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};