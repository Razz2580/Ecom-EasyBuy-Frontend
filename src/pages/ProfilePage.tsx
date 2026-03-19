import  { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userAPI, sellerAPI, riderAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UserRole } from '@/types';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  // Basic profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  
  // Bank details state (for sellers and riders) – upiId optional
  const [bankDetails, setBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Load bank details if user is seller or rider
  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        if (user?.role === UserRole.SELLER) {
          const data = await sellerAPI.getBankDetails();
          setBankDetails({
            accountHolder: data.accountHolder || '',
            accountNumber: data.accountNumber || '',
            ifsc: data.ifsc || '',
            upiId: data.upiId || '',
          });
        } else if (user?.role === UserRole.RIDER) {
          const data = await riderAPI.getBankDetails();
          setBankDetails({
            accountHolder: data.accountHolder || '',
            accountNumber: data.accountNumber || '',
            ifsc: data.ifsc || '',
            upiId: data.upiId || '',
          });
        }
      } catch {
        // Silently fail if no bank details exist yet
      }
    };
    loadBankDetails();
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updatedUser = await userAPI.updateProfile({ fullName, phone, address });
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setLoading(true);
    try {
      if (user?.role === UserRole.SELLER) {
        await sellerAPI.updateBankDetails(bankDetails);
      } else if (user?.role === UserRole.RIDER) {
        await riderAPI.updateBankDetails(bankDetails);
      }
      toast.success('Bank details saved');
    } catch {
      toast.error('Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">My Profile</h2>
          <p className="mb-2"><strong>Email:</strong> {user?.email}</p>
          <p className="mb-4"><strong>Role:</strong> {user?.role}</p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              {(user?.role === UserRole.SELLER || user?.role === UserRole.RIDER) && (
                <TabsTrigger value="bank">Payment Account</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  value={bankDetails.accountHolder}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input
                  value={bankDetails.ifsc}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                />
              </div>
              <div>
                <Label>UPI ID (optional)</Label>
                <Input
                  value={bankDetails.upiId}
                  onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveBankDetails} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Bank Details'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
