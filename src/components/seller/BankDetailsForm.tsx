//jd
const [bankDetails, setBankDetails] = useState({
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
});

const handleSaveBankDetails = async () => {
  try {
    // Assume there is an API endpoint to save bank details
    await sellerAPI.updateBankDetails(bankDetails);
    toast.success('Bank details saved');
  } catch (error) {
    console.error('Failed to save bank details:', error);
    toast.error('Failed to save');
  }
};




{/* Bank Details */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.15 }}
  className="mb-6"
>
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Payment Account Details</h3>
        <Button variant="outline" size="sm" onClick={handleSaveBankDetails}>
          Save
        </Button>
      </div>
      <div className="space-y-3">
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
      </div>
    </CardContent>
  </Card>
</motion.div>
