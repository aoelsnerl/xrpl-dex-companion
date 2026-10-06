
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

interface TrustlineFormProps {
  onCreateTrustline: (currency: string, issuer: string, limit?: string) => Promise<void>;
  isLoading: boolean;
}

export const TrustlineForm = ({ onCreateTrustline, isLoading }: TrustlineFormProps) => {
  const [form, setForm] = useState({
    currency: '',
    issuer: '',
    limit: '1000000000'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.currency && form.issuer) {
      try {
        await onCreateTrustline(form.currency, form.issuer, form.limit);
        setForm({ currency: '', issuer: '', limit: '1000000000' });
      } catch {
        // The hook already reported the error; keep the form so the user can fix it.
      }
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Create Trustline</span>
        </CardTitle>
        <CardDescription>
          Create a trustline to hold tokens from a specific issuer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency Code</Label>
            <Input
              id="currency"
              placeholder="USD"
              value={form.currency}
              onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
              className="bg-muted/50 border-border/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer Address</Label>
            <Input
              id="issuer"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={form.issuer}
              onChange={(e) => setForm(prev => ({ ...prev, issuer: e.target.value }))}
              className="bg-muted/50 border-border/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limit">Trust Limit (Optional)</Label>
            <Input
              id="limit"
              type="number"
              placeholder="1000000000"
              value={form.limit}
              onChange={(e) => setForm(prev => ({ ...prev, limit: e.target.value }))}
              className="bg-muted/50 border-border/50"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Trustline'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
