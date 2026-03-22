import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
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
  const navigate = useNavigate();

  // Basic profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Bank details state (for sellers and riders)
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 border-gray-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="mb-2 text-gray-600"><strong>Email:</strong> {user?.email}</p>
            <p className="mb-4 text-gray-600"><strong>Role:</strong> {user?.role}</p>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
                >
                  Profile Info
                </TabsTrigger>
                {(user?.role === UserRole.SELLER || user?.role === UserRole.RIDER) && (
                  <TabsTrigger
                    value="bank"
                    className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
                  >
                    Payment Account
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div>
                  <Label className="text-gray-700">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4">
                <div>
                  <Label className="text-gray-700">Account Holder Name</Label>
                  <Input
                    value={bankDetails.accountHolder}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Account Number</Label>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">IFSC Code</Label>
                  <Input
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">UPI ID (optional)</Label>
                  <Input
                    value={bankDetails.upiId}
                    onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                    className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                  />
                </div>
                <Button
                  onClick={handleSaveBankDetails}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all"
                >
                  {loading ? 'Saving...' : 'Save Bank Details'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
