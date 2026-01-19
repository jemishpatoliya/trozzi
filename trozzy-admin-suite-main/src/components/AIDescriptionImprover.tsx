import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import aiService from '@/services/aiService';

interface AIDescriptionImproverProps {
  originalDescription: string;
  productName: string;
  category: string;
  onImprovedDescription: (improved: string) => void;
}

const AIDescriptionImprover: React.FC<AIDescriptionImproverProps> = ({
  originalDescription,
  productName,
  category,
  onImprovedDescription
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setUsageStats(aiService.getUsageStats());
  }, []);

  const handleImproveDescription = async () => {
    if (!originalDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description to improve',
        variant: 'destructive'
      });
      return;
    }

    setIsImproving(true);
    try {
      const improved = await aiService.improveDescription(originalDescription, productName, category);
      setImprovedDescription(improved);
      setUsageStats(aiService.getUsageStats());
      
      toast({
        title: 'Success',
        description: 'Description improved successfully!'
      });
    } catch (error) {
      console.error('Failed to improve description:', error);
      toast({
        title: 'Error',
        description: 'Failed to improve description. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplyImprovement = () => {
    if (improvedDescription.trim()) {
      onImprovedDescription(improvedDescription);
      toast({
        title: 'Applied',
        description: 'Improved description has been applied to the product.'
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(improvedDescription);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Description copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerate = async () => {
    setIsImproving(true);
    try {
      // Add slight variation to prompt for different results
      const improved = await aiService.improveDescription(originalDescription + ' ', productName, category);
      setImprovedDescription(improved);
      setUsageStats(aiService.getUsageStats());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate description',
        variant: 'destructive'
      });
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI Description Improver
          </CardTitle>
          {usageStats && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {usageStats.tier} tier
              </Badge>
              <Badge variant="outline" className="text-xs">
                {usageStats.usageCount} uses
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Original Description
          </label>
          <Textarea
            value={originalDescription}
            readOnly
            className="min-h-[100px] bg-gray-50"
            placeholder="Enter your product description here..."
          />
        </div>

        {/* Improve Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleImproveDescription}
            disabled={isImproving || !originalDescription.trim()}
            className="flex items-center gap-2"
          >
            {isImproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Improving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Improve with AI
              </>
            )}
          </Button>
        </div>

        {/* Improved Description */}
        {improvedDescription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Improved Description
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isImproving}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <Textarea
              value={improvedDescription}
              readOnly
              className="min-h-[120px] bg-green-50 border-green-200"
            />
            <div className="flex justify-center">
              <Button
                onClick={handleApplyImprovement}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply This Description
              </Button>
            </div>
          </div>
        )}

        {/* Usage Info */}
        {usageStats && (
          <div className="text-xs text-gray-500 text-center border-t pt-3">
            <p>Free AI Service • {usageStats.usageCount} improvements made today</p>
            <p>Upgrade to Pro for unlimited improvements and advanced features</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDescriptionImprover;
