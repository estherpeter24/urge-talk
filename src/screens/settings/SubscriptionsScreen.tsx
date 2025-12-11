import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePaystack } from 'react-native-paystack-webview';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { accountService, SubscriptionPlan } from '../../services/api';

interface Subscription extends SubscriptionPlan {
  isCurrent?: boolean;
}

const SubscriptionsScreen = () => {
  const { theme } = useTheme();
  const { showSuccess, showError, showConfirm } = useModal();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { popup } = usePaystack();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await accountService.getSubscriptions();

      if (response.success && response.data) {
        const data = response.data;
        const plansWithCurrent: Subscription[] = data.plans.map(plan => ({
          ...plan,
          isCurrent: plan.id === data.current_plan,
        }));
        setSubscriptions(plansWithCurrent);
        setCurrentPlan(data.current_plan);
      } else {
        showError('Error', response.message || 'Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      showError('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (response: any) => {
    console.log('Paystack success:', response);
    const reference = response.reference || response.transactionRef || pendingReference;

    try {
      // Verify the payment on the backend
      const verifyResponse = await accountService.verifyPayment(reference || '');

      if (verifyResponse.success) {
        showSuccess('Success', 'Payment successful! Your subscription is now active.');
        loadSubscriptions();
      } else {
        showError('Error', verifyResponse.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      showError('Error', 'Payment verification failed. Please contact support.');
    } finally {
      setPendingReference(null);
    }
  };

  const handlePaystackCancel = () => {
    console.log('Paystack cancelled');
    setPendingReference(null);
    showError('Cancelled', 'Payment was cancelled');
  };

  const processSubscription = async (subscription: Subscription) => {
    try {
      setSubscribing(true);
      console.log('Starting subscription process for:', subscription.id);
      const response = await accountService.subscribeToPlan(subscription.id);
      console.log('Subscribe API response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('Response success, checking for paystack data...');
        console.log('paystack_public_key:', response.data?.paystack_public_key);
        console.log('reference:', response.data?.reference);
        // Check if we got payment data (for paid plans with Paystack)
        if (response.data?.paystack_public_key && response.data?.reference) {
          // Get user email or generate one from phone number
          const email = user?.email || `${user?.phoneNumber?.replace('+', '')}@urge.app`;
          const reference = response.data.reference;

          // Store reference for verification
          setPendingReference(reference);

          // Launch Paystack checkout using the hook
          // Note: The library internally multiplies by 100, so we pass the price in NGN (not kobo)
          console.log('Launching Paystack checkout with:', {
            email,
            amount: subscription.price,
            reference,
          });

          // Small delay to ensure confirm modal is fully closed before opening Paystack modal
          setTimeout(() => {
            popup.checkout({
              email: email,
              amount: subscription.price, // Pass in NGN, library converts to kobo internally
              reference: reference,
              onSuccess: handlePaystackSuccess,
              onCancel: handlePaystackCancel,
            });
            console.log('Paystack checkout called');
          }, 300);
        } else if (response.data?.authorization_url) {
          // Fallback to web checkout if Paystack WebView not available
          // This shouldn't happen with the native integration
          showSuccess('Payment', 'Please complete your payment');
          loadSubscriptions();
        } else {
          // Direct subscription (free plan)
          showSuccess('Success', `You've subscribed to ${subscription.name}!`);
          loadSubscriptions();
        }
      } else {
        showError('Error', response.message || 'Failed to subscribe');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      showError('Error', error.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubscribe = (subscription: Subscription) => {
    if (subscription.isCurrent) {
      showSuccess('Current Plan', 'You are already subscribed to this plan');
      return;
    }

    const priceStr = subscription.price === 0 ? 'Free' : `₦${subscription.price.toLocaleString()}/${subscription.period}`;

    showConfirm(
      `Subscribe to ${subscription.name}`,
      `Subscribe to ${subscription.name} for ${priceStr}?`,
      () => {
        // Don't await here - let the modal close first, then process
        processSubscription(subscription);
      }
    );
  };

  const SubscriptionCard = ({ subscription }: { subscription: Subscription }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: subscription.isCurrent ? theme.primary : theme.border,
          borderWidth: subscription.isCurrent ? 2 : 1,
        },
      ]}
    >
      {/* Header row with badge */}
      {subscription.isCurrent && (
        <View style={styles.badgeRow}>
          <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
            <Icon name="checkmark-circle" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        </View>
      )}

      {/* Plan name and price row */}
      <View style={[styles.cardHeader, subscription.isCurrent && { marginTop: 8 }]}>
        <View style={styles.planNameContainer}>
          <Text style={[styles.planName, { color: theme.text }]}>{subscription.name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.primary }]}>
            {subscription.price === 0 ? 'Free' : `₦${subscription.price.toLocaleString()}`}
          </Text>
          {subscription.price > 0 && (
            <Text style={[styles.period, { color: theme.textSecondary }]}>
              /{subscription.period}
            </Text>
          )}
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {subscription.description}
      </Text>

      <View style={styles.featuresContainer}>
        {subscription.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={theme.success || '#4CAF50'} />
            <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          {
            backgroundColor: subscription.isCurrent ? theme.surfaceElevated : theme.primary,
            borderWidth: subscription.isCurrent ? 1 : 0,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleSubscribe(subscription)}
        disabled={subscription.isCurrent || subscribing}
      >
        {subscribing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : subscription.isCurrent ? (
          <View style={styles.currentPlanButton}>
            <Icon name="checkmark" size={18} color={theme.textSecondary} />
            <Text style={[styles.subscribeButtonText, { color: theme.textSecondary }]}>
              Current Plan
            </Text>
          </View>
        ) : (
          <Text style={[styles.subscribeButtonText, { color: '#FFFFFF' }]}>
            Subscribe
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Subscriptions</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Subscriptions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Icon name="diamond" size={48} color={theme.primary} />
          <Text style={[styles.introTitle, { color: theme.text }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.introSubtitle, { color: theme.textSecondary }]}>
            Unlock premium features and enhance your URGE experience
          </Text>
        </View>

        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} />
        ))}

        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <Icon name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            You can cancel or change your subscription at any time. Changes will take effect at the end of your current billing period.
          </Text>
        </View>

        <View style={styles.paymentMethodsContainer}>
          <Text style={[styles.paymentMethodsTitle, { color: theme.textSecondary }]}>
            Secure payments powered by
          </Text>
          <View style={styles.paymentLogos}>
            <View style={[styles.paymentBadge, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.paymentBadgeText, { color: theme.text }]}>Paystack</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planNameContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  currentPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  period: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  paymentMethodsContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
  },
  paymentMethodsTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  paymentLogos: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paymentBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SubscriptionsScreen;
