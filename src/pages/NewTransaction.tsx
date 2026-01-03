import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { GrainSelector } from '@/components/transaction/GrainSelector';
import { PaymentSelector } from '@/components/transaction/PaymentSelector';
import { QuickKiloButtons } from '@/components/transaction/QuickKiloButtons';
import { useToast } from '@/hooks/use-toast';
import { GrainType, PaymentMethod, MillingCount, GRAIN_PRICES } from '@/types';
import { transactionApi, customerApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NewTransaction() {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();

  const [grainType, setGrainType] = useState<GrainType | null>(null);
  const [kilos, setKilos] = useState<number>(0);
  const [millingCount, setMillingCount] = useState<MillingCount>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [pricePerKilo, setPricePerKilo] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Calculate price when inputs change
  useEffect(() => {
    if (grainType && kilos > 0) {
      const basePrice = GRAIN_PRICES[grainType][millingCount];
      setPricePerKilo(basePrice);
      setTotalPrice(basePrice * kilos);
    } else {
      setPricePerKilo(0);
      setTotalPrice(0);
    }
  }, [grainType, kilos, millingCount]);

  const handleKiloChange = (value: number) => {
    setKilos(Math.max(0, value));
  };

  const showMillingCountOption = grainType === 'wheat' || grainType === 'wimbi';

  const handleSubmit = async () => {
    if (!grainType) {
      uiToast({ title: 'Select grain type', variant: 'destructive' });
      return;
    }
    if (kilos <= 0) {
      uiToast({ title: 'Enter kilos', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      
      const name = customerName.trim() || 'Walk-in Customer';

      // Create transaction via API
      await transactionApi.create({
        customer_name: name,
        grain_type: grainType,
        kilos,
        milling_count: millingCount,
        price_per_kilo: pricePerKilo,
        total_price: totalPrice,
        payment_method: paymentMethod,
        status: 'completed',
      });

      // If credit payment, create/update customer
      if (paymentMethod === 'credit') {
        try {
          const customers = await customerApi.getAll(name);
          const existingCustomer = customers.find(
            c => c.name.toLowerCase() === name.toLowerCase()
          );

          if (existingCustomer) {
            await customerApi.updateCredit(existingCustomer.id, totalPrice);
          } else {
            await customerApi.create({
              name,
              type: 'credit',
            });
            // After creating, update their credit
            const newCustomers = await customerApi.getAll(name);
            const newCustomer = newCustomers.find(
              c => c.name.toLowerCase() === name.toLowerCase()
            );
            if (newCustomer) {
              await customerApi.updateCredit(newCustomer.id, totalPrice);
            }
          }
        } catch (customerError) {
          console.error('Failed to update customer credit:', customerError);
          // Don't fail the transaction if customer update fails
        }
      }

      toast.success(`Transaction Saved! ${kilos}kg ${grainType} - KSh ${totalPrice}`);

      navigate('/');
    } catch (error) {
      console.error('Failed to create transaction:', error);
      uiToast({ 
        title: 'Failed to save transaction', 
        description: 'Please try again or check your connection',
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="New Milling Job" showBack />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Grain Type Selection */}
        <section className="animate-fade-in">
          <Label className="text-base font-semibold mb-3 block">
            What grain?
          </Label>
          <GrainSelector selected={grainType} onSelect={setGrainType} />
        </section>

        {/* Milling Count for wheat/wimbi */}
        {showMillingCountOption && (
          <section className="animate-slide-up">
            <Label className="text-base font-semibold mb-3 block">
              How many times milled?
            </Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={millingCount === 1 ? 'default' : 'outline'}
                size="lg"
                onClick={() => setMillingCount(1)}
                className="flex-1"
              >
                Once (5/kg)
              </Button>
              <Button
                type="button"
                variant={millingCount === 2 ? 'default' : 'outline'}
                size="lg"
                onClick={() => setMillingCount(2)}
                className="flex-1"
              >
                Twice (10/kg)
              </Button>
            </div>
          </section>
        )}

        {/* Kilos Input */}
        <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <Label className="text-base font-semibold mb-3 block">
            How many kilos?
          </Label>
          <div className="flex items-center gap-3 mb-3">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => handleKiloChange(kilos - 1)}
              disabled={kilos <= 0}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <Input
              type="number"
              inputSize="xl"
              value={kilos || ''}
              onChange={(e) => handleKiloChange(Number(e.target.value))}
              placeholder="0"
              className="text-center font-mono text-2xl flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => handleKiloChange(kilos + 1)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <QuickKiloButtons onSelect={setKilos} currentValue={kilos} />
        </section>

        {/* Customer Name */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Label className="text-base font-semibold mb-3 block">
            Customer name (optional)
          </Label>
          <Input
            inputSize="lg"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Walk-in Customer"
          />
        </section>

        {/* Payment Method */}
        <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <Label className="text-base font-semibold mb-3 block">
            Payment method
          </Label>
          <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} />
          {paymentMethod === 'mpesa' && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Till Number: <span className="font-mono font-bold">9778129</span>
            </p>
          )}
        </section>

        {/* Price Summary */}
        {totalPrice > 0 && (
          <section className="animate-scale-in bg-secondary/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-mono">KSh {pricePerKilo}/kg</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono">{kilos} kg</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-mono font-bold text-2xl text-primary">
                  KSh {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Submit Button */}
        <Button
          size="xl"
          onClick={handleSubmit}
          disabled={!grainType || kilos <= 0 || submitting}
          className="w-full gap-2"
        >
          <Check className="w-5 h-5" />
          {submitting ? 'Saving...' : 'Complete Transaction'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

