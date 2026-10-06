import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Wallet } from 'lucide-react';

interface WalletImportProps {
  onImport: (seed: string) => Promise<void>;
  isLoading: boolean;
}

export const WalletImport = ({ onImport, isLoading }: WalletImportProps) => {
  const [seed, setSeed] = useState('');
  const [showSeed, setShowSeed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seed.trim()) {
      try {
        await onImport(seed.trim());
      } catch {
        // The hook already reported the error.
      }
    }
  };

  return (
    <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-card">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">Import XRPL Wallet</CardTitle>
        <CardDescription>
          Enter your family seed (starts with "s") to import your XRPL wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seed">Secret Seed</Label>
            <div className="relative">
              <Textarea
                id="seed"
                placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="min-h-[100px] bg-muted/50 border-border/50"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                onClick={() => setShowSeed(!showSeed)}
              >
                {showSeed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={isLoading || !seed.trim()}
          >
            {isLoading ? 'Importing...' : 'Import Wallet'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/30">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This app connects to XRPL Mainnet. Make sure you're using a mainnet seed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};